var async = require('async');
var Promise = require('bluebird');
var _ = require('lodash')


function findPlugins(self,targetFunction){
    if(self){
        var plugins = self.$plugins;
        if(_.isArray(plugins)){
            return plugins;
        }else if(_.isFunction(plugins)){
            var ret = plugins.call(self,targetFunction);
            if(ret && !_.isArray(ret)){
                ret = [ret];
            }
            return ret;
        }
    }
}

function pluginCallback(targetFunction){//aop-function
    if(!_.isFunction(targetFunction)){
        throw new Error('targetFunction must be a function');
    }
    var plugins =  _.toArray(arguments).slice(1);
    plugins = _.flattenDeep(plugins);
    return function(){
        var cbs = [];
        var self = this;
        var pls = plugins;
        var selfPlugins = findPlugins(self,targetFunction);
        if(selfPlugins){
            pls = pls.concat(selfPlugins);
        }
        var params =  _.toArray(arguments);
        var callback = params[params.length-1];
        if(_.isFunction(callback)){
            params.pop();
        }else{
            callback = null;
        }
        var end = function(err){
            cbs = null;
            if(callback){
                callback(err);
            }
        }
        async.eachSeries(pls,function(plugin,next){
            if(!_.isFunction(plugin)){
                return next(new Error('plugin must be a function'));
            }
            plugin.apply(self,params.concat(function(err,cb){
                if(!err && _.isFunction(cb)){
                    cbs.unshift(cb);
                }
                next(err);
            }));
        },function(err){
            if(!err){
                targetFunction.apply(self,params.concat(function(er){
                    if(!er){
                        async.eachSeries(cbs,function(fn,next){
                            fn.call(self,next);
                        },end);
                    }
                }));
            }else{
                end(err);
            }
        });
    }
}

function pluginPromise(targetFunction){
    if(!_.isFunction(targetFunction)){
        throw new Error('targetFunction must be a function');
    }
    var plugins =  _.toArray(arguments).slice(1);
    plugins = _.flattenDeep(plugins);
   return function(){
       var self = this;
       var pls = plugins;
       var selfPlugins = findPlugins(self,targetFunction);
       if(selfPlugins){
           pls = pls.concat(selfPlugins);
       }
       var startPromise = Promise.resolve();
       var ends = [],args = arguments;
       pls.forEach(function(plugin){
           if(!_.isFunction(plugin)){
                throw new Error('plugin must be a function');
           }
           startPromise = startPromise.then(function(info){
               var ret = plugin.call(self,info);
               if(ret && ret.$start){
                   var end = ret.$end;
                   if(_.isFunction(end)){
                       ends.unshift(end);
                   }
                   ret = ret.$start;
               }
               return ret;
           });
       })
       return startPromise.then(function(){
           return targetFunction.apply(self,args);
       }).then(function(retValue){
           if(ends.length > 0){
               var res;
               var endPromise = new Promise(function(resolve, reject){
                   res = resolve;
               });
               ends.forEach(function(ele){
                   endPromise = endPromise.then(ele);
               });
               setImmediate(function(){
                   res();
               })
               return endPromise.return(retValue);
           }else{
               return retValue;
           }
       });
   }
}

exports.pluginCallback=pluginCallback;

exports.pluginPromise=pluginPromise;