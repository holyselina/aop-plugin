# aop-plugin
nodejs function aop plugin

```javascript
var aop = require('aop-plugin');
 
 //target function 
 var kill = function(who,blood,callback){
    setTimeout(function(){
       console.log('kill==>',who,':',blood);
       callback();
    },500);
 }
 
 kill = aop.pluginCallback(kill,function aop1(who,blood,next){
    console.log('this is aop1 start ')
    setTimeout(function(){
       next(null,function(nxt){
         console.log('this is aop1 end ');
         nxt();
       });
    },500);
 }
 ,function aop2(who,blood,next){
   console.log('this is aop2 start')
    setTimeout(function(){
       next(null,function(nxt){
         console.log('this is aop2 end ');
         nxt();
       });
    },500);
 }
 ,function aop3(who,blood,next){
   console.log('this is aop3 start')
    setTimeout(function(){
       next(null,function(nxt){
         console.log('this is aop3 end ');
         nxt();
       });
    },500);
 }
 );
 
 kill('bad-man',1000,function(err){
   console.log('kill finish ');
 })
 

```
