(function () {


    var gbc3d = Sudoku.GameBoardCell3D = function (i, j, value) {

        var vertexShader = "varying vec2 vUv; void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}"
            , fragmentShader = "uniform vec3 color; uniform sampler2D texture; varying vec2 vUv; void main() { vec4 tColor = texture2D( texture, vUv ); gl_FragColor = vec4( mix( color, tColor.rgb, tColor.a ), 1.0 );}";

        UIControls.ClickableMesh.call(this);

        this.uniforms = {
            color:{
                type:"c",
                value:new THREE.Color(0xffffff)
            },
            texture:{
                type:"t",
                value:Sudoku.textures[value]
            }
        };

        this.geometry = new THREE.PlaneGeometry(Sudoku.GameBoard3D.cellSize, Sudoku.GameBoard3D.cellSize);
        this.geometry.computeBoundingSphere();
        this.boundRadius = this.geometry.boundingSphere.radius;


        this.material = new THREE.ShaderMaterial({
            uniforms:this.uniforms,
            vertexShader:vertexShader,
            fragmentShader:fragmentShader
        });

        this.texture = this.uniforms.texture.value;

        this.texture.needsUpdate = true;

        this.material.side = THREE.DoubleSide;

        this.color = this.uniforms.color.value;

        this.i = i;
        this.j = j;

        //states
        this._isSelected = false;
        this._isStartingCell = false;
        this._isPrimaryClashing = false;
        this._isSecondaryClashing = false;

        this._tempStateTimer = null;

        this.addEventListener("mouseDown", this.select.bind(this));

    };


    gbc3d.prototype = Object.create(UIControls.ClickableMesh.prototype);


    gbc3d.prototype.select = function () {

        if (this._isSelected || this._isStartingCell) {
            return this;
        }

        this.dispatchEvent({
            type:"selected",
            cell:this
        });

        this._isSelected = true;

        if (!this.isClashing()) {
            statusChangedAnimation.call(this);
        }

        return this;

    };


    gbc3d.prototype.deselect = function () {

        if (!this._isSelected) {
            return this;
        }

        this.dispatchEvent({
            type:"deselected",
            cell:this
        });

        this._isSelected = false;

        if (!this.isClashing()) {
            statusChangedAnimation.call(this);
        }

        return this;

    };


    gbc3d.prototype.isSelected = function () {

        return this._isSelected;

    };


    gbc3d.prototype.setAsStartingCell = function () {

        if (this._isStartingCell) {
            return this;
        }

        if (this._isSelected) {
            this.deselect();
        }

        this.dispatchEvent({
            type:"setAsStartingCell",
            obj:this
        });

        this._isStartingCell = true;

        if (!this.isClashing()) {
            statusChangedAnimation.call(this);
        }

        return this;

    };


    gbc3d.prototype.unsetAsStartingCell = function () {

        if (!this._isStartingCell) {
            return this;
        }

        this.dispatchEvent({
            type:"unsetAsStartingCell",
            obj:this
        });

        this._isStartingCell = false;

        if (!this.isClashing()) {
            statusChangedAnimation.call(this);
        }

        return this;

    };


    gbc3d.prototype.isStartingCell = function () {

        return this._isStartingCell;

    };


    gbc3d.prototype.clash = function (clashType) {

        this._isPrimaryClashing = this._isSecondaryClashing = false;

        clashType = "_is" + clashType.substring(0, 1).toUpperCase() + clashType.substring(1).toLowerCase() + "Clashing";

        this[clashType] = true;

        if (this._tempStateTimer !== null) {
            clearTimeout(this._tempStateTimer);
            this._tempStateTimer = null;
        }

        this._tempStateTimer = setTimeout(undoClash.bind(this), primaryClashChange.length + 100);

        return statusChangedAnimation.call(this);

    };


    gbc3d.prototype.isClashing = function () {

        return this._isPrimaryClashing || this._isSecondaryClashing;

    };




    gbc3d.prototype.gameComplete = function () {

        gameCompleteAnimation.call(this);

    };


    function undoClash() {

        this._isPrimaryClashing = this._isSecondaryClashing = false;

        this._tempStateTimer = null;

        return statusChangedAnimation.call(this);

    }


    function statusChangedAnimation() {

        var statusChange;

        if (this._isPrimaryClashing) {
            statusChange = primaryClashChange;
        } else if (this._isSecondaryClashing) {
            statusChange = secondaryClashChange;
        } else if (this._isStartingCell) {
            statusChange = startingChange;
        } else if (this._isSelected) {
            statusChange = selectedChange;
        } else {
            statusChange = defaultChange;
        }

        for (var i in statusChange.color) {

            Utils.animate({
                obj:this.color,
                prop:i,
                targetValue:statusChange.color[i],
                length:statusChange.length
            });

        }

        return this;

    }


    function gameCompleteAnimation(){

        var len = 1000
            , dipTo = Math.random() * 0.7
            , self = this;
            ;


        Utils.animate({
            obj:this.color,
            prop:"r",
            targetValue:dipTo,
            length:len
        });
        Utils.animate({
            obj:this.color,
            prop:"g",
            targetValue:1,
            length:len
        });
        Utils.animate({
            obj:this.color,
            prop:"b",
            targetValue:dipTo,
            length:len,
            callback:function(obj, prop){
                statusChangedAnimation.call(self);
            }
        });

        cellVibrate.call(this, len, Sudoku.GameBoard3D.cellSpacing);

    }

    function cellVibrate(length,maxDisplacement){

        var endTime = Date.now() + length
            , restX = this.position.x
            , restY = this.position.y
            , internal = function(){

                if(endTime < Date.now()){
                    this.position.x = restX;
                    this.position.y = restY;
                    return;
                }

                this.position.x = restX + Math.random() * maxDisplacement;
                this.position.y = restY + Math.random() * maxDisplacement;

                requestAnimationFrame(internal);

            }.bind(this)
            ;

        requestAnimationFrame(internal);

    }


    function cellValueChangedAnimation(event) {

        var len = 500;

        if (event.value === Sudoku.GameBoard.emptyCell) {

            cellValueClearedAnimation.call(this);

        } else {

            cellValueEnteredAnimation.call(this);

        }

        this.uniforms.texture.value = Sudoku.textures[event.value];

    }


    function cellValueEnteredAnimation(length) {

        var len = length || 200;

        Utils.animate({
            obj:this.rotation,
            prop:"y",
            targetValue:-Math.PI * 2,
            length:len * 2,
            callback:function (obj, prop) {
                obj[prop] = 0;
            }.bind(this)
        });
        Utils.animate({
            obj:this.position,
            prop:"z",
            targetValue:Sudoku.GameBoard3D.cellSize * 2,
            length:len,
            callback:function (obj, prop) {
                Utils.animate({
                    obj:obj,
                    prop:prop,
                    targetValue:0,
                    length:len
                });
            }.bind(this)
        });

    }

    function cellValueClearedAnimation(length) {

        var len = length || 200;

        Utils.animate({
            obj:this.rotation,
            prop:"y",
            targetValue:Math.PI,
            length:len * 2,
            callback:function (obj, prop) {
                obj[prop] = 0;
            }.bind(this)
        });

        Utils.animate({
            obj:this.position,
            prop:"z",
            targetValue:Sudoku.GameBoard3D.cellSize * 2,
            length:len,
            callback:function (obj, prop) {
                Utils.animate({
                    obj:obj,
                    prop:prop,
                    targetValue:0,
                    length:len
                });
            }.bind(this)
        });

    }


    // status animation parameters
    var selectedChange = {
            length:100,
            color:{
                r:1,
                g:0.7,
                b:0.4
            }
        }
        , startingChange = {
            length:400,
            color:{
                r:0.4,
                g:0.4,
                b:1
            }
        }
        , primaryClashChange = {
            length:400,
            color:{
                r:1,
                g:0,
                b:0
            }
        }
        , secondaryClashChange = {
            length:400,
            color:{
                r:1,
                g:0.5,
                b:0.5
            }
        }
        , defaultChange = {
            length:200,
            color:{
                r:1,
                g:1,
                b:1
            }
        }
        ;


})();