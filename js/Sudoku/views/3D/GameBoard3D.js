(function () {


    Sudoku.GameBoard3D = function (gameBoard) {

        var n, nSqrd, cSpace, sgSpace, cSize, gSGB;
        n = gameBoard.getGameSize();
        nSqrd = n * n;
        cSpace = Sudoku.GameBoard3D.cellSpacing;
        sgSpace = Sudoku.GameBoard3D.subGridSpacing;
        cSize = Sudoku.GameBoard3D.cellSize;
        gSGB = gameBoard.getSubGridBoundsContainingCell.bind(gameBoard);

        THREE.Object3D.call(this);

        this.followCursor = false;

        this._gameBoard = gameBoard;

        this._cells = new Utils.MultiArray(nSqrd, nSqrd);

        this._selectedCell = null;

        for (var i = 0; i < nSqrd; i++) {
            for (var j = 0; j < nSqrd; j++) {

                this._cells[i][j] = new Sudoku.GameBoardCell3D(i, j, this._gameBoard.getValue(i, j));
                this.add(this._cells[i][j]);

                this._cells[i][j].position.x = (j * (cSize + cSpace) + gSGB(i, j).jSubGrid * sgSpace) - 0.5 * ((nSqrd - 1) * (cSize + cSpace) + (n - 1) * sgSpace);
                this._cells[i][j].position.y = -(i * (cSize + cSpace) + gSGB(i, j).iSubGrid * sgSpace) + 0.5 * ((nSqrd - 1) * (cSize + cSpace) + (n - 1) * sgSpace);
                this._cells[i][j].position.z = 0;

                this._cells[i][j].addEventListener("selected", cellSelected.bind(this));
                this._cells[i][j].addEventListener("deselected", cellDeselected.bind(this));
            }
        }

        this._cells[0][0].select();

        this._gameBoard.addEventListener("clash", clashRouter.bind(this));

        this._gameBoard.addEventListener("gameComplete", gameComplete.bind(this));

        this._keyPress = keyPress.bind(this);

        window.addEventListener("keydown", this._keyPress, false);

    };


    Sudoku.GameBoard3D.cellSize = 300;


    Sudoku.GameBoard3D.cellSpacing = 20;


    Sudoku.GameBoard3D.subGridSpacing = 40;


    Sudoku.GameBoard3D.prototype = Object.create(THREE.Object3D.prototype);


    Sudoku.GameBoard3D.prototype.enableClickableComponents = function (threePanel) {

        var n = this._gameBoard.getGameSize()
            , nSqrd = n * n
            ;

        for (var i = 0; i < nSqrd; i++) {
            for (var j = 0; j < nSqrd; j++) {
                threePanel.addClickable(this._cells[i][j]);
            }
        }

        return this;

    };


    Sudoku.GameBoard3D.prototype.disableClickableComponents = function (threePanel) {

        var n = this._gameBoard.getGameSize()
            , nSqrd = n * n
            ;

        for (var i = 0; i < nSqrd; i++) {
            for (var j = 0; j < nSqrd; j++) {
                theePanel.removeClickable(this._cells[i][j]);
            }
        }

        return this;

    },

        Sudoku.GameBoard3D.prototype.assignStartingCells = function () {

            var n = this._gameBoard.getGameSize()
                , nSqrd = n * n
                ;

            for (var i = 0; i < nSqrd; i++) {
                for (var j = 0; j < nSqrd; j++) {
                    if (this._cells[i][j].uniforms.texture.value !== Sudoku.textures[Sudoku.GameBoard.emptyCell]) {
                        this._cells[i][j].setAsStartingCell();
                    }
                }
            }

        }


    Sudoku.GameBoard3D.prototype.unassignStartingCells = function () {

        var n = this._gameBoard.getGameSize()
            , nSqrd = n * n
            ;

        for (var i = 0; i < nSqrd; i++) {
            for (var j = 0; j < nSqrd; j++) {
                if (this._cells[i][j].isStartingCell()) {
                    this._cells[i][j].unsetAsStartingCell();
                }
            }
        }

    }


    function cellSelected(event) {

        if (this._selectedCell !== null) {

            this._selectedCell.deselect();

        }

        this._selectedCell = event.cell;

    }


    function cellDeselected(event) {

        this._selectedCell = null;

    }


    function clashRouter(event) {

        var k
            , l
            , kUpper
            , lUpper
            , n = this._gameBoard.getGameSize()
            , nSqrd = n * n
            , sgb = this._gameBoard.getSubGridBoundsContainingCell(event.i, event.j)
            ;

        if (event.subType === "row") {

            k = event.i;
            l = 0;
            kUpper = k + 1;
            lUpper = nSqrd;

        } else if (event.subType === "column") {

            k = 0;
            l = event.j;
            kUpper = nSqrd;
            lUpper = l + 1;

        } else if (event.subType === "subGrid") {

            k = sgb.iLower;
            l = sgb.jLower;
            kUpper = sgb.iUpper + 1;
            lUpper = sgb.jUpper + 1;

        }

        for (; k < kUpper; k++) {
            for (var tempL = l; tempL < lUpper; tempL++) {
                if (k === event.i && tempL === event.j) {
                    this._cells[k][tempL].clash("Primary");
                } else {
                    this._cells[k][tempL].clash("Secondary");
                }
            }
        }

    }


    function keyPress(event) {

        var n = this._gameBoard.getGameSize()
            , nSqrd = n * n
            , val
            , i
            , j
            ;

        if (this._selectedCell === null) {
            return;
        }

        /*left arrow*/
        if (event.keyCode === 37) {
            i = this._selectedCell.i;
            j = this._selectedCell.j;
            j = (j - 1 < 0) ? nSqrd - 1 : j - 1;
            this._cells[i][j].select();
            return;
        }

        /*up arrow*/
        if (event.keyCode === 38) {
            i = this._selectedCell.i;
            j = this._selectedCell.j;
            i = (i - 1 < 0) ? nSqrd - 1 : i - 1;
            this._cells[i][j].select();
            return;
        }

        /*right arrow*/
        if (event.keyCode === 39) {
            i = this._selectedCell.i;
            j = this._selectedCell.j;
            j = (j + 1 >= nSqrd) ? 0 : j + 1;
            this._cells[i][j].select();
            return;
        }

        /*down arrow*/
        if (event.keyCode === 40) {
            i = this._selectedCell.i;
            j = this._selectedCell.j;
            i = (i + 1 >= nSqrd) ? 0 : i + 1;
            this._cells[i][j].select();
            return;
        }

        val = Sudoku.getTextureIndexFromKeyCode(event.keyCode);
        if (val > 0) {
            this._gameBoard.enterValue(this._selectedCell.i, this._selectedCell.j, val);
        } else if (val === 0) {
            this._gameBoard.clearValue(this._selectedCell.i, this._selectedCell.j);
        }
    }


    function gameComplete() {

        var n = this._gameBoard.getGameSize()
            , nSqrd = n * n
            ;

        for (var i = 0; i < nSqrd; i++) {
            for (var j = 0; j < nSqrd; j++) {
                this._cells[i][j].gameComplete();
            }
        }

    }

})();