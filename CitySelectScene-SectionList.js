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
    SectionList,
    Platform,
    NativeModules
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
const defaultHotCityArray = [
    {cityCode: "610100", cityName: "西安市"},
    {cityCode: "510100", cityName: "成都市"},
    {cityCode: "110000", cityName: "北京市"},
    {cityCode: "320100", cityName: "南京市"},
    {cityCode: "420100", cityName: "武汉市"},
    {cityCode: "440300", cityName: "深圳市"},
    {cityCode: "330100", cityName: "杭州市"},
    {cityCode: "310000", cityName: "上海市"},
    {cityCode: "440100", cityName: "广州市"}
]

const ITEM_HEIGHT = 44;      //item的高度
const HEADER_HEIGHT = 40;    //分组头部的高度
const SEPARATOR_HEIGHT = 0.5;  //分割线的高度
const sectionWidth = 20;
const statusHeight = 88;
const sectionTopBottomHeight = 60;
const sectionItemHeight = (height - sectionTopBottomHeight * 2 - statusHeight) / cityDatas.length;

export default class CitySelectScene extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentCity: "正在定位...",
            hotCityArray: [],
            isLocation: false,
            sectionListDatas: cityDatas,
            isTouchDown: false
        }
    }

    componentDidMount() {
        this.gotCurrentLocation();

        this.requestHotCityList();
    }

    async gotCurrentLocation() {
        // // 原生加高德定位方式
        // RNLocationHelper.startLocation()
        //     .then(result => {
        //         this.setState({
        //             currentCity: result,
        //             isLocation: true
        //         })
        //     })
        //     .catch(err => {
        //         this.setState({
        //             currentCity: "定位失败",
        //             isLocation: false
        //         })
        //     })

        this.gotLocationByNativeModule(); //默认定位方式

    }

    gotLocationByNativeModule() {
        if(Platform.OS==='android'){
            NativeModules.RNAppUtil.requestLocationPremession(true,(isGranted)=>{
                if (isGranted) {
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
            });
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
    
    requestHotCityList() {
        Api.getCityList()
           .then((response) => {
                let dataArray = response.data;
                this.setState({
                    hotCityArray: dataArray
                })
            })
            .catch((error) => {
                this.setState({
                    hotCityArray: defaultHotCityArray
                })
            })
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

    renderCityArray(hotCityArray) {
        let eleArray = []
        let marginX = (width-60-300)/2
        
        let subArray = hotCityArray.slice(0, 12)  // 测试
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

    separatorComponent(){
        return <View style={{height: 0.5, backgroundColor: '#999', marginLeft: 20, marginRight: 20}}/>
    }

    /*row*/
    renderItem(datas) {
        return (
            <TouchableOpacity onPress={()=>{this._selectNationalCity(datas.item)}} >
            <View style={{height: 48, justifyContent: 'center'}} >
                <Text style={{color: '#333333', marginLeft: 20, fontSize: 14}}>{datas.item.name}</Text>
            </View>
            </TouchableOpacity>
        )
    }
    renderSectionHeader(section) {
        return (
            <View style={{height: HEADER_HEIGHT, backgroundColor: '#F4F4F4', justifyContent: 'center'}} >
                <Text style={{color: "#999", fontSize: 17, marginLeft: 20, }}>{section.section.title}</Text>
            </View> 
        )
    }

    listFooterComponent() {
        return (
            <View style={{backgroundColor: "#FFFFFF", height: 40}} ></View>
        ) 
    }

    // /*用户手指开始触摸*/
    // responderGrant(event) {
    //     this.scrollSectionList(event);
    //     this.setState({
    //         isTouchDown: true,
    //     })
    // }
    // /*用户手指在屏幕上移动手指，没有停下也没有离开*/
    // responderMove(event){
    //     this.scrollSectionList(event);
    //     this.setState({
    //         isTouchDown: true,
    //     })
    // }
    // /*用户手指离开屏幕*/
    // responderRelease(event){
    //     this.setState({
    //         isTouchDown: false,
    //     })
    // }

    // /*手指滑动，触发事件*/
    // scrollSectionList(event) {
    //     const touch = event.nativeEvent.touches[0];
    //     // 手指滑动范围 从 A-Q  范围从50 到 50 + sectionItemHeight * cities.length
    //     if (touch.pageY - statusHeight >= sectionTopBottomHeight && touch.pageY <= statusHeight + sectionTopBottomHeight + sectionItemHeight * cityDatas.length) {
    //         //touch.pageY 从顶部开始，包括导航条 iOS 如此，如果是android 则具体判断
    //         const index = (touch.pageY - statusHeight - sectionTopBottomHeight) / sectionItemHeight;
    //         // 默认跳转到 第 index 个section  的第 1 个 item
    //         // this.refs.sectionList.scrollToLocation({animated: true, itemIndex: 0, sectionIndex: parseInt(index), viewOffset: 5});
    //     }
    // }

    scrollToList(index) {
        this.refs.sectionList.scrollToLocation({animated: true, itemIndex: 0, sectionIndex: parseInt(index), viewOffset: 44});
    }

    /*每一项的高度(rowHeight)和其在父组件中的偏移量(offset)和位置(index)
    * length :  当前rowItem的高度
    * offset ： 当前rowItem在父组件中的偏移量（包括rowItem的高度 + 分割线的高度 + section的高度）
    * index  :  当前rowItem的位置
    * 如果需要手动的跳转。则必须实现此方法
    * */
    getItemLayout(data, index) {
        let [length, separator, header] = [ITEM_HEIGHT, SEPARATOR_HEIGHT, HEADER_HEIGHT];
        return {length, offset: (length + separator) * index + header, index};
    }

    /*右侧索引*/
    _renderSideSectionView() {
        const sectionItem = cityDatas.map((item, index) => {
            return (
                <Text onPress={()=>this.scrollToList(index)}
                key={index} style={{textAlign: 'center',alignItems: 'center', height: sectionItemHeight, lineHeight: sectionItemHeight, color: '#C49225'}}>
                    {item.title}
                </Text>)
        });

        return (
            <View style={{position: 'absolute', width: sectionWidth, height: height - sectionTopBottomHeight*2, right: 5,
                top: 0, marginTop: sectionTopBottomHeight, marginBottom: sectionTopBottomHeight,}}
                ref="sectionItemView"
                // onStartShouldSetResponder={()=>true} // 在用户开始触摸的时候（手指刚刚接触屏幕的瞬间），是否愿意成为响应者？
                // onMoveShouldSetResponder={()=>true} // :如果View不是响应者，那么在每一个触摸点开始移动（没有停下也没有离开屏幕）时再询问一次：是否愿意响应触摸交互呢？
                // onResponderGrant={this.responderGrant.bind(this)} // View现在要开始响应触摸事件了。这也是需要做高亮的时候，使用户知道他到底点到了哪里
                // onResponderMove={this.responderMove.bind(this)} // 用户正在屏幕上移动手指时（没有停下也没有离开屏幕）
                // onResponderRelease={this.responderRelease.bind(this)} // 触摸操作结束时触发，比如"touchUp"（手指抬起离开屏幕）
            >
                {sectionItem}
            </View>
        );
    }
    
    render() {
        const cityTag =  this.renderCityArray(this.state.hotCityArray);
        return (
            <View style={{flex: 1}} >
            <View style={{backgroundColor: "#FFFFFF",}} >
            <Text style = {styles.titleText} >当前定位城市</Text>
                <View style = {styles.currentView} >
                    <TouchableOpacity onPress = {() => {this.currentCityAction(this.state.currentCity)}} 
                        style={{width: 100,}} >
                        <View style = {[styles.textView, {marginLeft: 15, width: 100,}]} >
                            <Text style = {{color: "#C49225", fontSize: 14,}} >{this.state.currentCity}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <Text style = {styles.titleText} >热门推单城市</Text>
                <View style = {styles.hotView} >
                    {cityTag}
                </View>
            </View>

            <SectionList
                style={{backgroundColor:'#FFFFFF'}}
                ref="sectionList"
                initialNumToRender= {50}
                renderSectionHeader={this.renderSectionHeader}
                renderItem={this.renderItem.bind(this)}
                sections={this.state.sectionListDatas}
                getItemLayout={this.getItemLayout}
                keyExtractor={(item, index) => index.toString()}
                ItemSeparatorComponent={this.separatorComponent}
                ListFooterComponent={this.listFooterComponent}
            />
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