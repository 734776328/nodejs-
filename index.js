const readline = require('readline');
const charset = require('superagent-charset');
const request = charset(require('superagent'));
const fs = require('fs')

const cheerio = require('cheerio');
const axios = require('axios')
const Koa = require('koa')
const async = require('async')
const app = new Koa()
// 延迟请求标识
let k = 4;
let g = 2000;
// 保存音频url过滤后的数组 （已拼接 已过滤）
let filterUrlArr = []; 
// 读取animal.txt的动物并保存(未过滤 未拼接)
let lines = []; 
// 保存所有拼接好的url （已拼接 未过滤）带 中英文URL
let urlPJ =[];
// 保存一个单词
let animalWordArr = [];
// 保存长单词
let moreWord = [];
// 过滤长单词
let filterMoreWord = [];
// let dirArr = ['tiger'];
var o = 0;
// 保存需要post请求的单词
let postWords = ''; 
// 保存需要post请求的数量
let postSum = 0;
// 总请求数量
let sum = 0;
// 保存get请求的数量
let getSum = 0;
// 记录异步数量
let asyncSum = 0;
let asyncSum2 = 0;
// 单词数量数
let animalNameSum = 0;
// 异步获取URL结束标志
let GET_URLS = 10;
// 异步获取音频URL结束标志
let GET_AUDIO_URLS = 10;
// --------------------------------------获取 animal URL---------------------------------------------------
String.prototype.getUrl = async function (callback) {
	await new Promise((resolve, reject)=>{
		lines.forEach((item,index)=>{
			let animalName = item.split(' ')[0];
			let animalNameChina = item.split(' ')[1];
			
			for (let i = 1; i < 200 ;i+=10) {
				let url = `http://www.findsounds.com/ISAPI/search.dll?start=${i}&keywords=${animalName}&seed=43-----${item}`
				urlPJ.push(url)
				fs.appendFile('拼接的getUrl.txt', url+'\r\n', function (err) {
					if (err) {
						console.log(err)
					}else{
						console.log('保存拼接的getUrl成功')
						GET_URLS = 10
					}
				})
			}
		})
		let interID = setInterval(()=>{
			if (GET_URLS < 0) {
				resolve();
				clearInterval(interID);
				GET_URLS === null;
			}
			GET_URLS--;
		},1000)
	})	
}

// ================================获取音频=======================================
let getAudio = function (callback) {
	console.log('需要请求的数量',filterUrlArr.length)
	var intervalIDS = []
	filterUrlArr.forEach((item,index)=>{
		var id = setTimeout(()=>{
			let urlItem = item.split('-----')[0];
			let animalName = item.split('-----')[1];
			request.get(urlItem).charset('binary').buffer(true).end(function (err, res) {
				if (err) {
					console.log('urlItem',urlItem)
					console.log(res)
				}
				if (!res) {return false}
				if (res.headers['content-type'].indexOf('audio')<0) {return false}
				fs.writeFile(`.//audio//${animalName}-${Math.ceil(Math.random()*200)}.wav`,res.text,'binary',(err)=>{
					if (err) {
			    		console.log('有错误了==========',err);
			    		return false;
			   		}
			  		console.log(animalName+'---下载成功')
				})
			})
			clearInterval(intervalIDS.splice(index,1,0)[0])
		},index*500)
		intervalIDS.push(id)
	})
}
// --------------------------获取 音频文件 audio------------------------------------
String.prototype.getAudioUrl = async function (callback) {
	console.log('到这了1')
	let type = ['.wav','.mp3','.au','.aif'];
	await new Promise((resolve, reject)=>{
		let intervalID = setInterval(()=>{
			if (GET_AUDIO_URLS < 0) {
				resolve();
				clearInterval(intervalID);
				GET_AUDIO_URLS = null;
			}
			GET_AUDIO_URLS--;
		},2000)
		async.mapLimit(urlPJ, 20, async (url, callback)=>{
			let animalName = url.split('-----')[1].split(' ')[0];
			let animalNameChina = url.split('-----')[1].split(' ')[1];
			await request
			.get(url.split('-----')[0])
			// .send({keywords: animalName, Search: 'search'})
			.set('Accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
			.set('Accept-Encoding','gzip, deflate')
			.set('Accept-Language','zh-CN,zh;q=0.9')
			.set('Content-Type','application/x-www-form-urlencoded')
			.set('Host','www.findsounds.com')
			.set('Origin','http://www.findsounds.com')
			.set('Referer','http://www.findsounds.com/ISAPI/search.dll')
			.set('Upgrade-Insecure-Requests',1)
			.set('User-Agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36')
			.set('buffer','true')
			.then((res)=>{
				GET_AUDIO_URLS = 10;
				let str1 = res.text.substring(res.text.indexOf('<script type="text/javascript">hit'))
				str1 = str1.substring(0,str1.indexOf('</script>'))

				let audioUrls = str1.replace('<script type="text/javascript">','').replace(/"/g,'').split(',').filter((item)=>{
					return item.length > 30 && (item.indexOf(type[0]) > 0 || item.indexOf(type[1]) > 0 || item.indexOf(type[2]) > 0 || item.indexOf(type[3]) > 0)
				});
				if (audioUrls.length === 0) {
					// url.postAudioUrl();
					return false;
				}
				console.log('get-url总数量：',getSum+=audioUrls.length);
				console.log('post-url总数量：',postSum);
				console.log('总数量：',getSum+postSum);
				console.log('长度',filterUrlArr.length);
				audioUrls = audioUrls.map((item)=>{
					if (item == '') return false;
					let itemA = item;
					if (itemA.indexOf('w') == 0) {
						itemA = 'http://'+itemA;
						myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
						return `${itemA}-----${animalName}-----${animalNameChina}`;
					} else if (itemA.indexOf('http://') === 0 && itemA.indexOf('www')<0) {
						itemA = itemA.replace('http://','http://www.');
						myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
						return `${itemA}-----${animalName}-----${animalNameChina}`
					} else if (itemA.indexOf('http://www') < 0) {
						itemA = 'http://www.'+itemA;
						myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
						return `${itemA}-----${animalName}-----${animalNameChina}`;
					} else {
						myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
						return `${itemA}-----${animalName}-----${animalNameChina}`; 
					}
				}).rmduplicateAudios();

				filterUrlArr.push(...audioUrls);
				filterUrlArr = filterUrlArr.myflat(2).rmduplicate();
			}).catch(error => console.log('caught', error))
		}, function(err, result){
			if(err){
				console.log(err);
			}else{
				console.log('resultgetAudioURL',result)
			}
		})
	})
}


String.prototype.postAudioUrl = function () {
	let url = this.split('-----')[0];
	let animalName = this.split('-----')[1].split(' ')[0];
	let animalNameChina = this.split('-----')[1].split(' ')[1];
	if (postWords.indexOf(animalName.toLowerCase()) >= 0) {
		return false;
	}
	postWords += animalName.toLowerCase()+'-----';
	myAppendFile('只能通过post获取的动物.txt',animalName.toLowerCase()+'-----\r\n','保存只能通过post获取的----'+animalName);
	let type = ['.mp3','.wav','.aif','.au','.aif'];
	
	request
		.post(url)
		.send({keywords: animalName, Search: 'search'})
		.set('Accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
		.set('Accept-Encoding','gzip, deflate')
		.set('Accept-Language','zh-CN,zh;q=0.9')
		.set('Content-Type','application/x-www-form-urlencoded')
		.set('Host','www.findsounds.com')
		.set('Origin','http://www.findsounds.com')
		.set('Referer','http://www.findsounds.com/ISAPI/search.dll')
		.set('Upgrade-Insecure-Requests',1)
		.set('User-Agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36')
		.set('buffer','true')
		.then(function(res){
			let str1 = res.text.substring(res.text.indexOf('<script type="text/javascript">hit'))
			str1 = str1.substring(0,str1.indexOf('</script>'))
			let audioUrls = str1.replace('<script type="text/javascript">','').replace(/"/g,'').split(',').filter((item)=>{
				return item.length > 30 && (item.indexOf(type[0]) > 0||item.indexOf(type[1]) > 0 || item.indexOf(type[2]) > 0|| item.indexOf(type[3]) > 0)
			});
			console.log('post-url总数量：',postSum+=audioUrls.length);
			console.log('get-url总数量：',getSum);
			console.log('总数量：',getSum+postSum)
			if (audioUrls.length <= 0) {
				return false;
			}
			audioUrls = audioUrls.map((item)=>{
				if (item == '') return false;
				let itemA = item;
				if (itemA.indexOf('w') == 0) {
					itemA = 'http://'+itemA;
					myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
					return `${itemA}-----${animalName}-----${animalNameChina}`;
				} else if (itemA.indexOf('http://') === 0 && itemA.indexOf('www')<0) {
					itemA = itemA.replace('http://','http://www.');
					myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
					return `${itemA}-----${animalName}-----${animalNameChina}`
				} else if (itemA.indexOf('http://www') < 0) {
					itemA = 'http://www.'+itemA;
					myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
					return `${itemA}-----${animalName}-----${animalNameChina}`;
				} else {
					myAppendFile('能获取的音频url.txt',`${itemA}-----${animalName} ${animalNameChina},`,'保存音频url '+filterUrlArr.length+'个成功');
					return `${itemA}-----${animalName}-----${animalNameChina}`; 
				}
			}).rmduplicateAudios();

			filterUrlArr.push(...audioUrls);
			filterUrlArr = filterUrlArr.myflat(2).rmduplicate();

		}).catch(error => console.log('caught', error))
}

// -----------------读取 animal.txt 获取动物名--------------------
async function readName (callback) {
	await new Promise(function (resolve,reject){
		fs.readFile("./animal.txt", "utf-8", function(error, data) {
			console.log("data.split('\r\n')[0]data.split('\r\n')[0]data.split('\r\n')[0]=============");
			for (let i = 0; i<data.split('\r\n').length; i++) {
				lines.push(data.split('\r\n')[i])				
			}
			lines = lines.rmduplicate()
			resolve();
		})
	})
	console.log('总共 '+ lines.length +' 个动物');
}

// ----------------------主入口-----------------
async.series([readName,''.getUrl,''.getAudioUrl,getAudio],function (err,result) {
	if (err || err === 'err') {
		console.log('err---',err);
	} else {
		console.log('result',result);
	}
})


// --------------------工具类------------------------

// --------动物名去重------
Object.defineProperty(Array.prototype,'rmduplicate',{
	value: function () {
		let duplicateArr = [];
		let o = {};
		if (this[0]) {
			duplicateArr.push(this[0]);
			o[this[0].split(' ')[0].toUpperCase()] = true;
		}
		for (let i = 1; i < this.length; i++) {
			if ( this[i] && !o[this[i].split(' ')[0].toUpperCase()]) {
				o[this[i].split(' ')[0].toUpperCase()] = true
				duplicateArr.push(this[i])
			}
		}
		console.log('duplicateArr',duplicateArr.length)
		return duplicateArr;
	}
})

// --------音频urls去重------
Object.defineProperty(Array.prototype,'rmduplicateAudios',{
	value: function () {
		let duplicateArr = [];
		let o = {};
		duplicateArr.push(this)
		if (this[0]) {
			o[this[0].toUpperCase()] = true
		} 
		for (let i = 1; i < this.length; i++) {
					
			if ( this[i] && !o[this[i].toUpperCase()]) {
				o[this[i].toUpperCase()] = true
				duplicateArr.push(this[i])
			}
		}
		return duplicateArr;
	}
})


// ---------提炼多单词动物名-----------
String.prototype.parseWord = function (callback) {
	if (!this) return false;
	let wordsArr = this.replace(/, /g,',').split(' ');
	wordsArr.forEach((item)=>{
		// 判断是长单词
		
		if (item !== item.toUpperCase() && item.indexOf(',') < 0) {
			console.log('长单词',item)
			let word = item + ' '+wordsArr[wordsArr.length-1];
			callback(word);
			myAppendFile('moreWord.txt', item +' '+wordsArr[wordsArr.length-1]+'\r\n','追加长单词');
		} else if ( item !== item.toUpperCase() && item.indexOf(',') > 0 ) {
			console.log('短单词',item)
			item.split(',').forEach( (word)=>{
				callback(word);
				myAppendFile('moreWord.txt', item.replace(/,/g,'') + ' '+wordsArr[wordsArr.length-1]+'\r\n','追加短单词');
			})
		} 
	})

}

// ==============扁平化===============
Object.defineProperty(Array.prototype, 'myflat',{
	value: function (n) {
		let flatArr = [];
		let count = n;
		let depth = 0;
		function flatFn (arr) {
			arr.map((item, index, target)=>{
				if ( Object.prototype.toString.call(item).slice(8,-1) === 'Array') {
					if ( depth < count ) {
						depth++;
						flatFn(item);
					} else {
						index === target.length -1 && depth--;
						flatArr.push(item);
					}
				} else {
					index === target.length -1 && depth--;
					flatArr.push(item);
				}
			})
		}
		flatFn(this)
		return flatArr;
	}
})

function myAppendFile (fileName, data, msg) {
	return (function(){
		fs.appendFile(fileName, data, function (err) {
		if (err) {
			console.log(msg+'失败');
			return false;
		}
		
		console.log(msg + '成功');

		})
	})()
}

