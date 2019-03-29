var playerWidth;
var musicUrl ;
var coverUrl ;
var songTitle ;
var singerTitle;
var auto = 0;
var loop = 1;

function getParameter(param)
{

        var query = window.location.search+"";//获取URL地址中？后的所有字符

        var iLen = param.length;//获取你的参数名称长度
        var iStart = query.indexOf(param);//获取你该参数名称的其实索引
        if (iStart == -1)//-1为没有该参数
        	return "";
        iStart += iLen + 1;
        var iEnd = query.indexOf("&", iStart);//获取第二个参数的其实索引
        if (iEnd == -1)//只有一个参数
            return query.substring(iStart);//获取单个参数的参数值
        return query.substring(iStart, iEnd);//获取第二个参数的值
    }

    function FreshTime () {
    	var times = audio.duration - audio.currentTime ;
    	var minute = times / 60;
    	var minutes = parseInt(minute);
    	if (minutes < 10) {
    		minutes = "0" + minutes;
    	}
    	var second = times % 60;
    	seconds = parseInt(second);
    	if (seconds < 10) {
    		seconds = "0" + seconds;
    	}
    	timerLabel.nodeValue = "" + minutes + "" + ":" + "" + seconds + "";
    	progressBar.style.width =(audio.currentTime / audio.duration) +"%"
    }

    function getPosition(ev) {
    	ev = ev || window.event;
    	var point = { x: 0, y: 0 };
    	if (ev.pageX || ev.pageY) {
    		point.x = ev.pageX;
    		point.y = ev.pageY;
            } else {//兼容ie  
            	point.x = ev.clientX + document.body.scrollLeft - document.body.clientLeft;
            	point.y = ev.clientY + document.documentElement.scrollTop;
            }
            return point;
        } 

        var audio = null;
        var timerLabel;
        var progressBar;
        function setAudio(){

        	var timer;
        	var bar = document.getElementById("bar");
        	audio = document.createElement('audio');
        	var playBtn  = document.getElementById("play");
        	var pauseBtn = document.getElementById("pause");
        	var mask = document.getElementById("mask");
        	timerLabel = document.getElementById("time").firstChild;
        	progressBar = document.getElementById("progressBar");
        	audio.src = musicUrl;
        	pauseBtn.style.visibility="hidden";

        	playBtn.onclick= function(){
        		audio.play();
        		playBtn.style.visibility="hidden";
        		pauseBtn.style.visibility="visible";
        		mask.style.visibility="hidden";
        		timer = setInterval("FreshTime()",500)
        	};
        	pauseBtn.onclick= function(){
        		audio.pause();	
        		pauseBtn.style.visibility="hidden";
        		playBtn.style.visibility="visible";
        		mask.style.visibility="visible";
        		clearInterval(timer);
        	};


         if(!audio){
            audio.load(); //加载音乐
        }  

        audio.addEventListener("loadeddata",  
        	function() {
        		FreshTime();
        	});
        if(auto == 1 ) {
        	alert("audio.duration");
        	audio.play();
        	mask.style.visibility="visible";
        }
        if(loop == 1){
            audio.loop = true; //循环播放
        }
        
    }

    function init () {

			//封面图片
			document.getElementById('cover').src =coverUrl;
			//歌名
			document.getElementById("song").firstChild.nodeValue =songTitle;
			//歌手
			document.getElementById("singer").firstChild.nodeValue =singerTitle;

		}


        function GetSongById (id) {

           musicUrl =  musicList.Songs[id].url ;
           coverUrl = musicList.Songs[id].cover ;
           songTitle = musicList.Songs[id].title ;
           singerTitle = musicList.Songs[id].singer ;

       }


//页面加载后执行
window.onload = function(){

    GetSongById(getParameter("id"));

    init();
    setAudio();
}