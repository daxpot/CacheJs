
/* Copyright (C) 2016 ZengKui, http://zengkv.com */

(function ( root, factory ) {

    if ( typeof exports === 'object' ) {

        // CommonJS like
        module.exports = factory(root);

    } else if ( typeof define === 'function' && define.amd ) {

        // AMD
        define( function() { return factory( root ); });

    } else {

        // Browser global
        root.createCache = factory( root );
    }

}( typeof window !== "undefined" ? window : this, function ( window ) {


    /*
    ----------------------------------------------------------------------

        Utilities

    ----------------------------------------------------------------------
    */

    function isObject( object ) {

        return Object.prototype.toString.call( object ) == "[object Object]";
    }

    function getTime() {

        return parseInt( new Date().getTime()/1000 );
    }

    Object.prototype.map = function( cb ) {

        Object.keys(this).map(cb);
    }

    /**
     * 创建一个缓存
     * @param options {string 或者 object} 创建缓存的参数，object必须有name, deadline,request属性，分别代表缓存的名字（唯一），缓存数据的超时时间(-1为永久缓存)，request为请求数据的函数（当缓存不存在时则调用请求）
     * @returns {function(id, cb, ...)}  返回的这个函数先检测id对应的缓存是否存在，存在则返回，不存在则调用请求函数请求内容 cb后面的参数为调用requests时候需要传递的参数
     */
    var createCache = function(options) {

        var CACHE_NAME, CACHE_DEAD, CACHE_MAX, req;

        if( isObject( options ) ) {

            CACHE_NAME = options["key"];
            CACHE_DEAD = options["deadline"];
            CACHE_MAX = options["length"];
            req = options["request"];

            if(!CACHE_NAME || !(CACHE_DEAD || CACHE_MAX) || !req) {

                throw new Error("createCache param must be an object and have name, request, deadline or length attributes");
                return;
            }
        }
        else {

            throw new Error("createCache param must be an object");
            return;
        }

        var caches = { };

        var readCache = function() {

            if(typeof wx != "undefined" && wx.getStorageSync) {

                caches = wx.getStorageSync( CACHE_NAME );
                caches ? true : caches = {};
            }
            else {

                caches = localStorage.getItem( CACHE_NAME );
                caches ? caches = JSON.parse( caches ) : caches = {};
            }
        }

        var writeCache = function() {

            if(typeof wx != "undefined" && wx.setStorageSync) {

                wx.setStorageSync( CACHE_NAME, caches )
            }
            else {

                var txt = JSON.stringify( caches );
                localStorage.setItem( CACHE_NAME, txt );
            }
        }

        var addCache = function( id, obj ) {

            var now  = getTime();
            obj["reqt"] = now;

            //先检查是否超时
            if(CACHE_DEAD) {    

                caches.map( function( k ) {

                    if(now - caches[k]["reqt"] > CACHE_DEAD) delete caches[k];
                });
            }

            //再检查是否超长
            if(CACHE_MAX && Object.keys( caches ).length >= CACHE_MAX) {

                var dellen = Object.keys( caches ).length - CACHE_MAX + 1;
                var delobjs = [];

                var insert = function( id, reqt ) {

                    var i;
                    var obj = {"id": id, "reqt": reqt};

                    for( i = 0; i < delobjs.length; i++ ) {

                        if( obj["reqt"] < delobjs[i]["reqt"] ) break;
                    }

                    delobjs.splice( i, 0, obj );

                    if( delobjs.length > dellen ) {

                        delobjs.pop();
                    }
                }

                caches.map( function( k ) {

                    insert(k, caches[k]["reqt"]);
                });

                for( var i = 0; i < delobjs.length; i++ ) {

                    delete caches[delobjs[i]["id"]];
                }
            }
            
            caches[id] = obj;
            
            writeCache();
        }

        var checkCache = function( id ) {
            var now = getTime();

            if( CACHE_DEAD && caches[id] && now - caches[id]["reqt"] < CACHE_DEAD ) {

                caches[id]["reqt"] = now;
                writeCache();
                return caches[id];
            }
            return false;
        }

        readCache();        //读取缓存

        return function(id, cb) {
            
            var check = checkCache(id);

            if( check ) {

                cb && cb( check );
                return;
            }

            var params = [ function( ret ){

                var obj = {};

                if( !isObject( ret ) ) {

                    obj["data"] = ret
                }
                else {

                    obj = ret;
                }

                if( !obj["errmsg"] ) {

                    addCache( id, obj );
                }

                cb(obj);

            }, function() {

                cb( { "errmsg":"请求失败" } );
            }];

            if( arguments.length > 2 ) {

                for( var i = arguments.length-1; i >= 2; i-- ) {

                    params.unshift(arguments[i]);
                }
            }
            else {

                params.unshift(id);
            }

            req.apply( this, params );
        }
    };

    return createCache;
}));