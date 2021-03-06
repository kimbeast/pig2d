/**
 * Created with JetBrains WebStorm.
 * User: gbox3d
 * Date: 13. 3. 30.
 * Time: 오후 3:35
 * version : 0.8
 * it is parts of pig2d engine
 * this engine is base on html5 css3
 */


Pig2d = {
};

/////////////////////
///model

Pig2d.model = Backbone.Model.extend({
    initialize: function() {

        var element = document.createElement('div');

        var name = this.get('name');
        if(name != undefined) {

            element.setAttribute('id',name);
        }


        //2.3 이전 버전을 위한
        if(element.classList != undefined) {
            element.classList.add('pig2d-node');
        }
        else {
            $(element).addClass('pig2d-node');
        }


        this.attributes.element = element;

        this.attributes.update_signal = 'none';

        this.attributes.translation = new gbox3d.core.Vect2d(0,0);
        this.attributes.scale = new gbox3d.core.Vect2d(1,1);

        //this.attributes.matrix = mat2d.create();
        //this.attributes.matrix = new WebKitCSSMatrix();

        this.attributes.flipX = false;
        this.attributes.flipY = false;

        this.attributes.cssupdate = true;
        this.attributes.cancelTransition = false;

        this.attributes.offset = {
            x:0,
            y:0
        };
    },
    defaults: {
        rotation : 0
    },
    getPosition : function() {

        //if(decompose == true) {
            //행렬분해후 적용
        //    this.decomposeCssMatrix(this.getCssMatrix());
        //}


        return this.attributes.translation;
    },
    getRotation : function() {
        return this.attributes.rotation;
    },
    setPosition : function(x,y) {

        this.attributes.translation.set(x,y);
        return this;
    },
    setRotation : function(angle) {
        this.attributes.rotation = angle;
        return this;
    },
    rotate : function(angle_delata) {
        this.attributes.rotation += angle_delata;
        return this;
    },
    setScale : function(x,y) {

        this.attributes.scale.set(x,y);

        return this;

    },
    getScale : function() {

        return this.attributes.scale;

    },
    translate: function () {

        var v1 = new gbox3d.core.Vect2d();
        var center = new gbox3d.core.Vect2d(0,0);

        return function ( distance, axis ) {

            // axis is assumed to be normalized

            v1.copy( axis );
            v1.multiply( distance );

            v1.rotate( gbox3d.core.degToRad(-this.attributes.rotation),center);

            if(this.attributes.flipX) {
                v1.X *= -1;
            }

            if(this.attributes.flipY) {
                v1.Y *= -1;
            }

            this.attributes.translation.addToThis( v1 );

            return this;

        };

    }(),

    /////////////////////
    ////행렬관련
    //////////////////
    getCssMatrix : function() {

        var el = this.get('element');
        var computedStyle = window.getComputedStyle(el);
        var trans = computedStyle.getPropertyValue('-webkit-transform');

        var cssmat = new WebKitCSSMatrix(trans);

        return cssmat;

    },
    //주어진 행렬을 분해하여 노드변환값에 역적용하기
    decomposeCssMatrix : function(cssmat) {
        //var cssmat = this.getCssMatrix();

        //이동변환 얻기
        this.attributes.translation.X = cssmat.e;
        this.attributes.translation.Y = cssmat.f;

        //스케일 얻기
        var scalex = Math.sqrt(cssmat.a*cssmat.a + cssmat.b*cssmat.b);
        var scaley = Math.sqrt(cssmat.c*cssmat.c + cssmat.d*cssmat.d);

        this.attributes.scale.X = scalex;
        this.attributes.scale.Y = scaley;

        //회전 얻기
        var angle = Math.round(Math.atan2(cssmat.b/scalex, cssmat.a/scalex) * (180/Math.PI));
        this.attributes.rotation = angle;

    },
    getDecomposePosition : function() {

        var cssmat = this.getCssMatrix();

        return new gbox3d.core.Vect2d(cssmat.e,cssmat.f);

    },

    ////////////// animator
    setupTransition : function(param) {
        var element = this.get('element');

        element.style.WebkitTransition = '';
        this.attributes.TransitionEndCallBack = param.TransitionEndCallBack;

        this.attributes._TransitionEndCallBack = function() {

            if(this.attributes.cancelTransition == true) {

                this.attributes.cancelTransition = false;
            }
            else {
                this.attributes.cssupdate = true;
                element.style.WebkitTransition = '';
                if(this.attributes.TransitionEndCallBack != undefined) {

                    this.attributes.TransitionEndCallBack.apply(this);

                }
            }


        }.bind(this);

        element.addEventListener('webkitTransitionEnd',this.attributes._TransitionEndCallBack,false);

//        if(param.timing_function != undefined) {
//            element.style.webkitTransitionTimingFunction = 'linear';
//        }

        return this;

    },
    transition : function(param) {

        var element = this.get('element');

        param.timing_function = param.timing_function ? param.timing_function : 'linear';

        if(element.style.WebkitTransition !== '')
            return;

        if(param.position != undefined) {

            if(param.position.X == this.attributes.translation.X && param.position.Y == this.attributes.translation.Y ) {

            }
            else {
                if(element.style.WebkitTransition === '') {
                    element.style.WebkitTransition = '-webkit-transform ' + param.time + 's ' + param.timing_function;
                    this.setPosition(param.position.X,param.position.Y);
                }
            }
        }

        if(param.rotation != undefined) {
            if(param.rotation == this.attributes.rotation) {

            }
            else {
                if(element.style.WebkitTransition === '') {
                    element.style.WebkitTransition = '-webkit-transform ' + param.time + 's '+ param.timing_function;

                }
                this.setRotation(param.rotation);

            }
        }
        if(param.scale != undefined) {
            if(param.scale.X == this.attributes.scale.X && param.scale.Y == this.attributes.scale.Y) {

            }
            else {
                if(element.style.WebkitTransition === '') {
                    element.style.WebkitTransition = '-webkit-transform ' + param.time + 's ' + param.timing_function;

                }
                this.setScale(param.scale.X,param.scale.Y);

            }
        }

    },
    stopTransition : function(param) {

        this.attributes.update_signal = 'stop_transition';
        this.attributes.cancelTransition = true;

        return this;

    },
    clearTransition : function() {

        var el = this.get('element');
        el.removeEventListener('webkitTransitionEnd',this.attributes._TransitionEndCallBack);
        this.attributes.update_signal = 'stop_transition';


    },
    ////////////////////
    updateCSS : function() {

        //if(this.attributes.cssupdate == false) return;

        var el = this.get('element');

        switch (this.attributes.update_signal) {

            case 'none':
                (function() {
                    //오브잭트변환값을 앨리먼트쪽으로 갱신해주기
                    if(this.attributes.cssupdate == true) {

                        var trans = this.attributes.translation;
                        var rot = this.attributes.rotation;
                        var scalex = this.attributes.scale.X;
                        var scaley = this.attributes.scale.Y;

                        //반전 적용
                        if(this.attributes.flipX) {
                            scaley = -scaley;
                        }
                        if(this.attributes.flipY) {
                            scalex = -scalex;
                        }

                        var css_val = 'translate(' + trans.X + 'px,' + trans.Y +'px) ' +
                            'rotate(' + rot + 'deg) ' +
                            'scale(' + scalex + ',' + scaley + ')';

                        //브라우져 호환성을 위한 코드
                        el.style.WebkitTransform = css_val;
                        el.style.MozTransform = css_val;
                        el.style.oTransform = css_val;
                        el.style.transform = css_val;

                        //트랜지션 상태이면 css를 더이상 업데이트 못하게 한다
                        if(el.style.WebkitTransition !== '') {
                            this.attributes.cssupdate = false;
                        }

                    }
                    else {
                        //현재 트랜지션 상태이므로 트래지션 취소는 무효화 된다.
                        this.attributes.cancelTransition = false;

                    }

                }).bind(this)();
                break;
            case 'stop_transition':
                (function() {

                    //행렬분해후 적용
                    this.decomposeCssMatrix(this.getCssMatrix());


                    el.style.WebkitTransition = '';
                    this.attributes.update_signal = 'none';
                    this.attributes.cssupdate = true;

                    this.updateCSS();

                }).bind(this)();
                break;

        }

        return this;


    },

    //////////////////////////
    //노드에서 완전히 제거할때 사용됨
    destroy : function() {

        var el = this.get('element');
        //el.removeEventListener('webkitTransitionEnd');
        this.clearTransition();
        el.parentNode.removeChild(el);

    },
    clone : function() {
        var model  = Backbone.Model.prototype.clone.call(this);
//        console.log(model);
        model.set("element",this.get('element').cloneNode(true));
        return model;

    }

});
//end of base model
//////////////////////

Pig2d.SpriteModel = Pig2d.model.extend({
    initialize: function(param) {
        Pig2d.model.prototype.initialize.call(this);

        this.attributes.currentFrame = 0;

        //애니메이션 타이머 핸들
        this.attributes.animationHID = null;

        var sheet = document.createElement('canvas');

        sheet.classList.add('pig2d-sheet');
        sheet.style.position = 'absolute';

        this.get('element').appendChild(sheet);
        this.set('sheet',sheet);

        this.setFrame(0);

        this.attributes.currentTick = 0;

    },
    clone : function() {

        var model  = Backbone.Model.prototype.clone.call(this);
        console.log('SpriteModel clone');
        //model.set("element",this.get('element').cloneNode(true));

        return model;

    },
    updateCSS : function (deltaTime) {

        deltaTime = deltaTime || 0;
        this.applyAnimation(deltaTime);

        return Pig2d.model.prototype.updateCSS.call(this);

    },
    //////////////////////////////////////////////
    //애니메이션 관련 기능
    //////////////////////////////////////////////
    setFrame : function(index)  {
        //프레임 노드 얻기

        var imgObj = this.get('imgObj');

        if(imgObj != undefined) {
            this.set('currentFrame',index);

            var sheet = this.get('sheet');
            var frame = this.attributes.data.frames[this.attributes.currentFrame];
            var sheet_data = frame.sheets[0];

            sheet.width = sheet_data.width;
            sheet.height = sheet_data.height;

            sheet.style.left =  sheet_data.centerOffset.x + 'px';
            sheet.style.top = sheet_data.centerOffset.y + 'px';

            var ctx		= sheet.getContext('2d');
            ctx.drawImage(
                this.get('imgObj'),
                -sheet_data.bp_x,-sheet_data.bp_y,sheet.width,sheet.height,
                0,0,sheet.width,sheet.height
            );
        }

        return this;
    },
    start_animate : function(param) {

        var delay = this.get('data').frames[0].delay;
        this.setFrame(0);

        setTimeout(this.animate(param).bind(this),delay);


    },
    stop_animate : function() {

        if(this.attributes.animationHID != null) {
            clearTimeout(this.attributes.animationHID);
            this.attributes.animationHID = null;
        }
    },
    animate : function(param) {

        param = param || {};

        var loop = param.loop || false;

        var frameindex =  this.get('currentFrame');

        var data = this.get('data');

        return (function() {

            var endFrame = param.endFrame || data.frames.length - 1;

            if(frameindex >= endFrame) {//마지막 프레임이면

                param.endCallBack ? param.endCallBack(this) : (function(){})();

                if(loop == true) {

                    if(param.startFrame != undefined ) {
                        if(!param.startFrame)
                        {
                            frameindex = 0;
                        }
                        else {
                            frameindex = param.startFrame;
                        }

                    }else {
                        frameindex = 0;
                    }
                    this.setFrame(frameindex);
                    var delay = data.frames[frameindex].delay;

                    this.attributes.animationHID = setTimeout(this.animate(param).bind(this),delay);
                }

            }
            else {

                ++frameindex;

                this.setFrame(frameindex);
                var delay = data.frames[frameindex].delay;
                this.attributes.animationHID =setTimeout(this.animate(param).bind(this),delay);
            }


        }).bind(this);

    },

    /////////////////////////////////////////////
    /////new animation system////////////////////
    /////////////////////////////////////////////

    setupAnimation : function(param) {

        param = param ? param : {};

        this.attributes.startFrame = param.startFrame ? param.startFrame : 0 ;
        this.attributes.endFrame = param.endFrame ? param.endFrame : (this.get('data').frames.length-1);
        this.attributes.isAnimationLoop = param.isAnimationLoop ? param.isAnimationLoop : true;
        this.attributes.AnimationStatus = param.AnimationStatus ? param.AnimationStatus : 'play';

        this.setFrame(this.attributes.startFrame);

    },
    applyAnimation : function(delataTick) {


        //console.log(delataTick);

        if(this.attributes.AnimationStatus == 'play') {
            this.attributes.currentTick += delataTick;
            var frameindex =  this.attributes.currentFrame;
            var Ani_data = this.get('data');

            var delay = Ani_data.frames[frameindex].delay / 1000;

            //console.log(this.attributes.currentTick);

            if(this.attributes.currentTick > delay) {
                this.attributes.currentTick = 0;
                ++frameindex;

                //console.log(this.attributes.endFrame);

                if(frameindex > this.attributes.endFrame) {//마지막 프레임이면

                    if(this.attributes.isAnimationLoop) {
                        frameindex = this.attributes.startFrame;
                    }
                    else {
                        this.attributes.AnimationStatus = 'stop';
                        frameindex = this.attributes.endFrame;
                    }

                    if(this.attributes.AnimationEndCallback != undefined) {

                        this.attributes.AnimationEndCallback.bind(this)();

                    }

                }
                else {

                }

                this.setFrame(frameindex);

            }
        }
        else {

        }

    },
    stopAnimation : function() {

    },
    ////////////////////////

    destroy : function() {

        this.stop_animate();

        //슈퍼 클래싱
        Pig2d.model.prototype.destroy.call(this);
    }


});
//end of sprite model
///////////////////////

//////////////////node//
/////////////////////////

Pig2d.node = Backbone.Model.extend({
    initialize: function() {
        this.attributes.chiledren = new Array();

//        _.bindAll(this,"update","clone");

    },
    traverse : function(callback,param) {

        callback.bind(this)(param);

        for(var index = 0;index < this.attributes.chiledren.length;index++ ) {
            this.attributes.chiledren[index].traverse(callback,param);
        }

    },
    update: function(applyChild,deltaTime) {

        this.get('model').updateCSS(deltaTime);

        if( applyChild == true) {

            for(var index = 0;index < this.attributes.chiledren.length;index++ ) {
                this.attributes.chiledren[index].update(applyChild,deltaTime);
            }
        }

        return this;

    },
    clone : function() {

        //딥 클로닝

        var node  = Backbone.Model.prototype.clone.call(this);

        if(node.get('model')) {

            var model = node.get('model').clone();
            node.set({model:model});
        }


        var chiledren = this.get('chiledren');

        for(var i=0;i<chiledren.length;i++) {

            node.add(chiledren[i].clone());
        }

        return node;
    },
    findByName : function(name) {

        if(name == this.attributes.name) return this;

        for(var index in this.attributes.chiledren ) {
            var obj = this.attributes.chiledren[index].findByName(name);
            if(obj != null)
                return obj;
        }
        return null;
    },
    add : function(child_node,parents) {

        if(parents == undefined || parents == null) {
            parents = this;
        }

        parents.get('chiledren').push(child_node);

        //모델이 존재하면
        if(parents.get('model')) {
            var par_el = parents.get('model').get('element');
            var child_el = child_node.get('model').get('element');
        }
        par_el.appendChild(child_el);

        child_node.attributes.parent = parents;

        return this;
    },
    //부모노드 바꾸기
    setParent : function(parent) {

        var old_parent = this.get('parent');

        var chiledren = old_parent.get('chiledren');


        for(var i= chiledren.length-1;i >= 0;i--) {

            if(chiledren[i] === this) {
                chiledren.splice(i,1);
                parent.add(this);
            }
        }

    },
    removeChild : function(node) {

        for(var i= this.attributes.chiledren.length-1;i >= 0;i--) {

            var _node = this.attributes.chiledren[i];

            if(_node === node) {

                this.attributes.chiledren.splice(i,1);

                node.get('model').destroy();

                return true;
            }
            else {
                _node.removeChild(node); //자식노드까지 검사
            }
        }

        return false;

    },
    removeChildAll : function() {

        for(var i= this.attributes.chiledren.length-1;i >= 0;i--) {
            this.removeChild(this.attributes.chiledren[i]);
        }

        return false;

    },
    show : function(visible) {

        console.log(this.get('model').get('element'));

        this.get('model').get('element').style.visibility = visible ? 'visible' : 'hidden';
    }

});
//end of node
///////////////
///
Pig2d.SceneManager = Backbone.Model.extend({

    initialize: function(param) {


       // param.window_size = param.window_size ? param.window_size : {};

        var rootNode = new Pig2d.node(
            {
                model : new Pig2d.model({
                    name : 'root_' + (new Date()).getTime() + '_'
                })

            }
        );
        rootNode.get('model').setPosition(0,0);
        //this.attributes.container.append(rootNode.get('model').get('element'));

        var rootElement = rootNode.get('model').get('element');


        if(param.window_size != undefined) {
            rootElement.style.overflow = 'hidden';
            rootElement.style.width = param.window_size.width + 'px' ;
            rootElement.style.height = param.window_size.height + 'px' ;
        }

        if(param.bkg_color != undefined) {

            rootElement.style.backgroundColor = param.bkg_color;
        }



        this.attributes.container.appendChild(rootElement);
        this.attributes.rootNode = rootNode;

    },
    getRootNode : function() {
        return this.attributes.rootNode;
    },
    updateAll : function(deltaTime) {

        deltaTime = deltaTime ? deltaTime : 0.01;

        this.attributes.rootNode.update(true,deltaTime);

    },
    add : function(node,parent) {

        if(parent == undefined) {
            this.attributes.rootNode.add(node);
        }
        else {
            parent.add(node);
        }

    },
    addImageNode : function(param) {

        //var node = Pig2d.util.createImage(param.img_info);
        //this.add(node,param.parent);

        var center_x = param.center ? param.center.x : 0;
        var center_y = param.center ? param.center.y : 0;

        var node = Pig2d.util.createDummy();

        var imgObj = new Image();
        imgObj.onload = function(evt) {

            //console.log(this.width);

            imgObj.style.position = 'absolute';
            imgObj.style.left = -this.width/2 + parseInt(center_x) + 'px';
            imgObj.style.top = -this.height/2 + parseInt(center_y) + 'px';

            var element = node.get('model').get('element');

            element.appendChild(imgObj);

            node.get('model').set('imgObj', imgObj);

            if(param.onload) {
                param.onload(node);
            }

        }
        imgObj.src = param.src;

        this.add(node,param.parent);

        return node;
    },
    addSpriteSceneNode : function(param) {

        var node = Pig2d.util.createSprite(param.spr_info);

        node.show(true);
        this.add(node,param.parent);
        return node;

    }


});
//end of scene manager

////////////////////////
///util

Pig2d.util = {

    ///////////////
    createDummy : function() {

        return new Pig2d.node({
            model:new Pig2d.model()
        });

    },
    //////////////////
    //캔버스 기반의 스프라이트 생성
    createSlicedImage : function(param) {

        var model = new Pig2d.model();
        var element = model.get('element');

        var cutx = param.cutx || 0;
        var cuty = param.cuty || 0;
        var basex = param.basex || 0;
        var basey = param.basey || 0;

        var canvas	= document.createElement( 'canvas' );
        canvas.width	= param.width || param.imgObj.width;
        canvas.height	= param.height || param.imgObj.height;

        canvas.style.position = 'absolute';
        //canvas.style.left =  basex + 'px';
        //canvas.style.top = basey + 'px';

        canvas.style.WebkitTransform = 'translate(' + basex +'px,' + basey + 'px)';

        element.appendChild(canvas);

        var ctx		= canvas.getContext('2d');
        ctx.drawImage(param.imgObj,cutx,cuty,canvas.width,canvas.height,0,0,canvas.width,canvas.height);

        var node = new Pig2d.node();
        node.set({model : model});

        return node;
    },
    ////////////////
    createSprite : function(param) {


        var startFrame = param.startFrame || 0;
        var endFrame = param.endFrame || (param.animation.frames.length-1);

        //노드생성
        var node = new Pig2d.node();
        var model =  new Pig2d.SpriteModel( {
                data : param.animation,
                imgObj : param.texture
            }
        );
        node.set(
            { model : model }
        );

        node.get('model').setupAnimation({
            startFrame:startFrame,
            endFrame:endFrame
        });


        /*var  element = $('<div></div>');

        var node = new Pig2d.node(
            {
                el : element// $('.pig2d-templet .pig2d-sprite-templ ').clone(),
            }
        );

        node.set(
            {
                model : new Pig2d.SpriteModel( {
                        data : param.SpriteData,
                        editor_info : param.editor_info ? param.editor_info :  {
                            width : 320,
                            height : 240
                        },
                        node :node
                    }
                )}
        );
        */

        return node;

    },
    //////////////////
    createImage : function(param) {
        //노드생성

        var node = new Pig2d.node(
            {
                model : new Pig2d.model()
            }
        );

        console.log('create img');

        if(param.center) {

            var element = document.createElement('div');

            element.style.backgroundImage = 'url('+ param.texture +')';
            element.style.width = param.texture_size.width + 'px';
            element.style.height = param.texture_size.height + 'px';

            var cssval = 'translate('+ -param.center.x +'px,' + -param.center.y + 'px)'
            element.style.WebkitTransform = cssval ;

            node.get('model').get('element').appendChild(element);

        }
        else {
            node.get('model').setTexture(param);
        }


        return node;

    },
    //////////////////////////////
    SetupAsset : function(param) {

        var asset_path = param.asset_path;
        var img_files = param.img_files;
        var animation_files = param.animation_files;
        var OnLoadComplete = param.OnLoadComplete;
        var OnLoadProgress = param.OnLoadProgress;
        var textures = {};
        var animations = {};
        var i=0;


        function preLoadAnimation(evt) {

            if(evt) {
                console.log(evt);
                animations[evt.name] = evt;
            }

            if(animation_files.length <= i) {

                var result = {};
                result.textures = textures;
                result.animations = animations;
                if(OnLoadComplete != undefined)
                    OnLoadComplete(result);

            }
            else {
                var url = asset_path + animation_files[i];
                i++;
                $.ajax({
                    type : "GET",
                    url : url,
                    dataType : "json",
                    success : preLoadAnimation
                });
            }

        }


        (function preLoadImg() {

            var imgObj = new Image();
            imgObj.onload = function() {

                var evt = {};
                textures[img_files[i]] = imgObj;

                evt.percent = (i/img_files.length) * 100;
                evt.currentIndex = i;

                if(OnLoadProgress != undefined)
                    OnLoadProgress(evt);

                i++;

                if(i < img_files.length) {
                    preLoadImg(); //다음 이미지 로딩
                }
                else {

                    if(animation_files) {
                        i=0;
                        preLoadAnimation();
                    }
                    else {
                        var result = {};
                        result.textures = textures;
                        if(OnLoadComplete != undefined)
                            OnLoadComplete(result);

                    }


                }

            }

            imgObj.src =  asset_path + img_files[i];


        })();
    },

    ///테스트용 컨트롤러
    setup_pig2dTestController : function (listener_element,node) {
        function callbackControl(movementX,movementY) {

            node.get('model').rotate(movementX);
            node.get('model').translate(movementY,new gbox3d.core.Vect2d(0,1));
//                Smgr.updateAll();
        }


        //이벤트처리
        listener_element.addEventListener( 'mousedown', onDocumentMouseDown, false );
        listener_element.addEventListener( 'touchstart', onDocumentTouchStart, false );
        listener_element.addEventListener( 'touchmove', onDocumentTouchMove, false );


        function onDocumentMouseDown( event ) {

            event.preventDefault();

            listener_element.addEventListener( 'mousemove', onDocumentMouseMove, false );
            listener_element.addEventListener( 'mouseup', onDocumentMouseUp, false );

        }

        function onDocumentMouseMove( event ) {

            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            callbackControl(movementX,-movementY);

        }

        function onDocumentMouseUp( event ) {

            listener_element.removeEventListener( 'mousemove', onDocumentMouseMove );
            listener_element.removeEventListener( 'mouseup', onDocumentMouseUp );

        }

        //터치 디바이스
        var touchX,  touchY;

        function onDocumentTouchStart( event ) {

            event.preventDefault();

            var touch = event.touches[ 0 ];

            touchX = touch.screenX;
            touchY = touch.screenY;

        }

        function onDocumentTouchMove( event ) {

            event.preventDefault();

            var touch = event.touches[ 0 ];

            var movementX =  (touchX - touch.screenX);
            var movementY =  (touchY - touch.screenY);
            touchX = touch.screenX;
            touchY = touch.screenY;

            callbackControl(movementX,movementY);
        }

    }// end of setup_pig2dTestController





}





