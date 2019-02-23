# ReactNative写的城市列表页
> 效果图

![gif](https://github.com/xinmingZhou/cityListScene/blob/master/屏幕录制%202019-02-23%2011.09.44.mov)


首先来看需求
> 页面包含当前定位，热门城市，全国的城市列表。其中全国城市列表页带字母分类，右侧带有字母索引

讲道理，要完成这个需求，我能想到的是城市列表如何实现？ScrollView、FlatList、SectionList。
当然经过思考后，首先想到的是用SectionList来完成，所以第一版出来的效果是SectionList组件完成的页面。但是，这时候遇到了个问题，因为全国城市的数量过多，在SectionList渲染完可视的页面后，点击右侧索引跳转到对应的字母区域的滚动效果不太好，而且会有空白的渲染问题。
不过在使用支付宝APP的里面定位功能时候，加载和跳转索引都非常流畅，我就好奇是怎么实现的了。肯定不是使用SectionList，Google后相关资料后尝试了用ScrollView做了第二版，最后的结果如支付宝的组件版顺畅。

## ScrollView版的城市列表

首先看页面布局，全国城市列表的数据自己查找一份，数据格式自己处理了一遍，大概是这个格式。之所以转化成这样是因为第一版用SectionList的数据源必须是这种格式，包含key和data(必须是这个名字)

> 城市列表JSON数据图片

![JSON数据格式](https://github.com/xinmingZhou/cityListScene/blob/master/城市JSON.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/50)


页面布局的代码如图
> 页面布局代码

详细的参考代码去吧，接下来聊聊实现思路

## 开发思路

 1. 获取字母表头（索引数组）

我们可以通过遍历来获取大写字母

  
```
_gotLettersArray() {
    
  let  LettersArray  = []
    
  for (let  i  =  0; i  <  cityDatas.length; i++) {
    
      let  element  =  cityDatas[i];
    
      LettersArray.push(element.title)
    
  }
    
  return  LettersArray
    
}
```

 2. 获取每个字母区域的高度

首先定义一个空数组用于存放每个字母区域的高度，其次初始化一个变量，其值与没个城市列表的高度相同，最后遍历得到没个区域的高度并将其放进去，这样便得到一个完整的储存高度的数组了

```
_gotTotalHeightArray() {
    let totalArray = []
    for (let i = 0; i < cityDatas.length; i++) {
        let eachHeight = ROW_HEIGHT * (cityDatas[i].data.length + 1);
        totalArray.push(eachHeight);
    }
    return totalArray
}
```

3. 点击右侧字母自动滑动到相应位置

当我们点击右侧字母时进入点击事件，通过scrollTo()使页面跳转到相应下标的高度上去。

```
    scrollToList(item, index) {
        let position = 0;
        for (let i = 0; i < index; i++) {
            position += totalHeight[i]
        }
        this.refs.ScrollView.scrollTo({y: position})
    }
```

## 最后
这就是用ScrollView完成的城市列表，相对来说简单多了，而且体验也更好，更多请参考代码

sectionList版本的代码参考sectionListCode


