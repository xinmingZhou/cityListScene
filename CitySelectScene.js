/**
 * 选择城市
 * @author Eric
 */
import React, { Component } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Platform,
    NativeModules, 
} from 'react-native'
import {WelabLocationModule,ConfigUtil} from '@welab/xlib-rn-config-picker'
import Api from "../communication/Api";
import NavigationService from '../router/NavigationService';
import RNLocationHelper from "../communication/RNLocationHelper";
import { EmitterUtils, EmitterKeys } from '../utils/EmitterUtils';
import NationalCityList from '../components/biz/NationalCityList';
import CommonDialog from '../components/biz/dialog/CommonDialog';


const {width, height} = Dimensions.get("window")
const cityDatas = NationalCityList.NationalCityArray()
const hotCitys = []
const defaultHotCityArray = [
    {cityCode: "310000", cityName: "上海市"},
    {cityCode: "440300", cityName: "深圳市"},
    {cityCode: "110000", cityName: "北京市"},
    {cityCode: "440100", cityName: "广州市"},
]
const sectionWidth = 20;
const statusHeight = 88;
const sectionTopBottomHeight = 60;
const sectionItemHeight = (height - sectionTopBottomHeight * 2 - statusHeight) / cityDatas.length;
const ROW_HEIGHT = 48;
const totalHeight = [];
const letters = [];


export default class CitySelectScene extends Component {
    constructor(props) {
        super(props);

        totalHeight = this._gotTotalHeightArray()
        letters = this._gotLettersArray()
        console.log('citys ==> ', cityDatas )

        this.state = {
            currentCity: "正在定位...",
            isLocation: false,
            sectionListDatas: cityDatas,
            letterWords: 'A'
        }
    }

    // 获取每个字母区域的高度
    _gotTotalHeightArray() {
        let totalArray = []
        for (let i = 0; i < cityDatas.length; i++) {
            let eachHeight = ROW_HEIGHT * (cityDatas[i].data.length + 1);
            totalArray.push(eachHeight);
        }
        return totalArray
    }

    // 获取字母列表头
    _gotLettersArray() {
        let LettersArray = []
        for (let i = 0; i < cityDatas.length; i++) {
            let element = cityDatas[i];
            LettersArray.push(element.title)
        }
        return LettersArray
    }

    componentWillMount() {
        this.gotCurrentLocation();
        this.requestHotCityList();
    }

    requestHotCityList() {
        const { navigation } = this.props;
        hotArray = navigation.getParam('params');
        if (hotArray.length > 0) {
            hotCitys = hotArray
        } else {
            hotCitys = defaultHotCityArray
        }
    }

    async gotCurrentLocation() {
        this.gotLocationByNativeModule();
    }

    gotLocationByNativeModule() {
        if(Platform.OS==='android'){
            WelabLocationModule.requestGPSPermission(res=>{
                if(res.status === 'Authorized') {
                    this.startLocationModule()
                } else {
                    this.setState({
                        currentCity: "定位失败",
                        isLocation: false
                    })
                    CommonDialog.show({
                    label:'为方便您查询当前位置，我们需要您授予我们读取地址位置的权限',
                    onPress:()=>this.gotoAppSetting()
                    })
                }
             })
        } else {
            this.startLocationModule()
        }
    }

    gotoAppSetting(){
        if(Platform.OS==='android') {
           NativeModules.RNAppUtil.gotoAppSetting();
        }
    }

    startLocationModule() {
        WelabLocationModule.getLocation((callback) => {
            if (callback.address !== undefined) {
                let address = callback.address;
                let cityArry = address.split(',')
                if(cityArry.length > 1 ) {
                    this.setState({
                        currentCity: cityArry[1],
                        isLocation: true
                    })
              }
            } else {
                this.setState({
                    currentCity: "定位失败",
                    isLocation: false
                })
            }
        })
    }

    // 匹配cityCode
    getCityCode(name) {
        let dataList = ConfigUtil.getConfigCache('AreasCache').areas.data
        let result = ''
        let hasFound = false;
        for(var i = 0;i < dataList.length;i++){
            for(var j = 0;j < dataList[i]['areas'].length;j++){
                if(dataList[i]['areas'][j].name.indexOf(name)>-1){
                    result = dataList[i]['areas'][j].id;
                    hasFound = true;
                    break;
                }
            }
            if(hasFound)
                break;
        }
        return result;
    }

    selectHotCityAction(element) {
        EmitterUtils.emit(EmitterKeys.SELECT_HOTCITY_NAME,element)
        NavigationService.goBack();
    }

    currentCityAction(name) {
        if (this.state.isLocation) {
            let locationCityCode = this.getCityCode(name)
            if (locationCityCode) {                
                let item = {"cityName": name, "cityCode": locationCityCode}
                EmitterUtils.emit(EmitterKeys.SELECT_HOTCITY_NAME,item)
                this.props.navigation.goBack();
            }else {
                // 查找不到对应的城市code 提示定位失败
                alert("暂不支持该城市")
            }
        } else {
            this.props.navigation.goBack();
        }       
    }

    renderHotCityArray(hotCityArray) {
        let eleArray = []
        let marginX = (width-60-300)/2
        
        let subArray = hotCityArray.slice(0, 12)
        // marginLeft:(index%3!==0?marginX:0)
        for (let index = 0; index < subArray.length; index++) {
            const element = subArray[index];
             const ele = <TouchableOpacity  key = {element.cityCode} onPress = {() => this.selectHotCityAction(element)} >
                    <View style = {[styles.textView, {marginTop: 10}]} >
                        <Text style = {{color: "#333333", fontSize: 14, }} >{element.cityName}</Text>
                    </View>
                </TouchableOpacity>
            eleArray.push(ele);
            
        }
        return eleArray;
    }

    _selectNationalCity(data) {
        let item = {"cityName": data.name, "cityCode": data.id}
        EmitterUtils.emit(EmitterKeys.SELECT_HOTCITY_NAME,item)
        this.props.navigation.goBack();
    }


    // TODO 城市列表滚动监听 设置悬浮的header 
    _contentViewScroll = (e) => {
        let cityPosition = []
        let each_Y = 0
        let position_Y = e.nativeEvent.contentOffset.y
        // 定义每个字母区域的坐标
        for (let i = 0; i < totalHeight.length; i++) {
            each_Y += totalHeight[i]
            cityPosition.push(each_Y)  
        }
        for (let i = 0; i < letters.length; i++) {
            if (position_Y > 0 && position_Y < cityPosition[0]) {
                this.setState({letterWords: 'A'})
            } else if (position_Y >= cityPosition[i] && position_Y < cityPosition[i+1]) (
                this.setState({letterWords: letters[i+1]})
            )         
        }
    }

    // 点击右侧字母滑动到相应位置
    scrollToList(item, index) {
        let position = 0;
        for (let i = 0; i < index; i++) {
            position += totalHeight[i]
        }
        this.refs.ScrollView.scrollTo({y: position})
    }

    /*右侧索引*/
    _renderSideSectionView() {
        const sectionItem = cityDatas.map((item, index) => {
            return (
                <Text onPress={()=>this.scrollToList(item, index)}
                    key={index} style={{textAlign: 'center',alignItems: 'center', height: sectionItemHeight, lineHeight: sectionItemHeight, color: '#C49225'}}>
                    {item.title}
                </Text>)
        });

        return (
            <View style={{position: 'absolute', width: sectionWidth, height: height - sectionTopBottomHeight*2, right: 5,
                top: 0, marginTop: sectionTopBottomHeight, marginBottom: sectionTopBottomHeight,}}
                ref="sectionItemView"
            >
                {sectionItem}
            </View>
        );
    }

    // 渲染城市列表
    _renderCityList() {
        let lists = []
        for (let i = 0; i < cityDatas.length; i++) {
            let sections = cityDatas[i];
            let header = <View key={sections.title} style={{height:ROW_HEIGHT, backgroundColor:'#F4F4F4', justifyContent: 'center'}} >
                <Text style={{color: "#999", fontSize: 17, marginLeft: 20, }}>{sections.title}</Text>
            </View>
            lists.push(header)
            
            for (let j = 0; j < sections.data.length; j++) {
                let element = sections.data[j];
                let cityCell = <TouchableOpacity key={element.name+j} onPress={()=>{this._selectNationalCity(element)}} >
                        <View style={{height:ROW_HEIGHT, justifyContent:'center', backgroundColor:'#FFFFFF', marginLeft:20}} >
                            <Text style={{color:'#333333', fontSize:14, }}>{element.name}</Text>
                        </View>
                    </TouchableOpacity>
                lists.push(cityCell)
            }
        }
        return lists
    }
    
    render() {
        return (
            <View style={{flex: 1}} >
            <View style={{backgroundColor: "#FFFFFF",}} ref='topViews' >
                <Text style = {styles.titleText} >当前定位城市</Text>
                <View style = {styles.currentView} >
                    <TouchableOpacity onPress = {() => {this.currentCityAction(this.state.currentCity)}} 
                        style={{width: 100,}} >
                        <View style = {[styles.textView, {marginLeft: 15, width: 100,}]} >
                            <Text style = {{color: "#C49225", fontSize: 14,}} >{this.state.currentCity}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <Text style = {styles.titleText} >热门城市</Text>
                <View style = {styles.hotView} >
                    {this.renderHotCityArray(hotCitys)}
                </View>
            </View>

            <ScrollView style={{backgroundColor:'#FFFFFF', }}
                ref="ScrollView"
                // onScroll={this._contentViewScroll}
                >
                {this._renderCityList()}
            </ScrollView>
            {this._renderSideSectionView()} 
            </View>
            
        ) 
    }
}

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: "#ECEBED"
    },
    titleText: {
        marginLeft: 30, 
        marginTop: 20, 
        color: "#999999",
        fontSize: 13,
    },
    currentView: {
        marginTop: 10,
        paddingBottom: 20
    },
    textView: { 
        minWidth: 40, 
        height: 30, 
        justifyContent: "center", 
        alignItems:"center",
        backgroundColor: "#FFF", 
        borderRadius: 5,
        paddingLeft: 10,
        paddingRight:10,
        marginRight:10,
    },
    hotView: {
        marginTop: 5,  
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginLeft: 30,
        marginRight: 25,
        paddingBottom: 20,
        marginBottom: 15,
    }
     
})