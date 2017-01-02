# CacheJs

CacheJs是一个基于localStorage的数据缓存程序，主要用于缓存key-value型数据，可配置缓存的时长或最多缓存key的个数。同时该程序也支持微信小程序storage

createCache函数参数及返回说明:

 * 创建一个缓存
 * @param options {object} 创建缓存的参数，object必须有name, deadline 或 length,request属性，分别代表缓存的名字（唯一），缓存数据的超时时间或缓存key的个数，request为请求数据的函数（当缓存不存在时则调用请求）
 * @returns {function(id, cb, ...)}  返回的这个函数先检测id对应的缓存是否存在，存在则返回，不存在则调用请求函数请求内容 cb后面的参数为调用requests时候需要传递的参数

示例
```javascript
var testCache = createCache({
	key: "test",				//缓存在localStorage的key
	deadline: 60,  				//缓存截止时间60s
	length: 5, 					//最多缓存5条记录
	request: function(id, cb) {	//模拟请求，当key不存在缓存中时调用该函数获取数据加入缓存		
     document.write("<span style='color:red'>调用request请求id:" + id + "</span><br>");
		cb(id);
	}
});	

var testIds = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2];
testIds.map(function(id){
	document.write("<br>请求id:" + id + "<br>");
	testCache(id, function(ret){
		document.write("获取id:" + id + ",ret:" + JSON.stringify(ret) + "<br>");
	});
});

```
