function GameInit(wincallback) {
    var docElem = document.documentElement;
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');

    var rootWidth = canvas.parentElement.clientWidth;
    var rootHeight = canvas.parentElement.clientHeight;

    var canvasSize = Math.min(rootWidth, rootHeight);

    var canvasWidth = canvas.width = rootWidth * 2;
    var canvasHeight = canvas.height = rootHeight * 2;
    var maze;
    var PI = Math.PI;
    var TAU = PI * 2;
    var dragAngle = null;
    var keyDrugMove = null;
    var isKeyHovered = false;
    var isKeyDragging = false;
    var winAnim;

    var gridSize = Math.min(40, canvasSize / 12);
    var mazeCenter = {
        x: canvasWidth / 4,
        y: Math.min(gridSize * 8, canvasHeight / 4)
    };

    var levelList = {
        // *=.=.
        //     !
        // . . .
        //     !
        // @=.=.
        'level1': {
            textContent: '*=.=.\n    !\n. . .\n    !\n@=.=.'
        },
        // * . .
        //     !
        // . . .
        //     !
        // @=.=.
        'level2': {
            textContent: '* . .\n    !\n. . .\n    !\n@=.=.'
        },
        // @=. .
        //
        // . . .
        //     !
        // *=. .
        'level3': {
            textContent: '@=. .\n      \n. . .\n    !\n*=. .'
        }
    }
    var levels = Object.keys(levelList);


    var nextLevelButton = document.querySelector('.next-level-button');

    function loadLevel(id) {
        var pre = levelList[id];

        maze = new Maze();
        maze.id = id;

        maze.loadText(pre.textContent);

        nextLevelButton.classList.remove('is-open');
        window.scrollTo(0, 0);
    }

    loadLevel(levels[0]);

    canvas.addEventListener('pointermove', onHoverMousemove);
    animate();

    var canvasLeft = canvas.offsetLeft;
    var canvasTop = canvas.offsetTop;

    var pointerBehavior;

    var keyDrug = {};
    var mazeRotate = {};

    var click;
    canvas.addEventListener('pointerdown', function(event) {
        event.preventDefault();
        click = true
        var isInsideKey = getIsInsideKey(event);
        pointerBehavior = isInsideKey ? keyDrug : mazeRotate;
        pointerBehavior.pointerDown(event, event);
    })

    function getIsInsideKey(pointer) {
        var position = getCanvasMazePosition(pointer);
        var KeyDeltaX = Math.abs(position.x - Key[maze.orientation].x * gridSize);
        var KeyDeltaY = Math.abs(position.y - Key[maze.orientation].y * gridSize);
        var bound = gridSize * 1.5;
        return KeyDeltaX <= bound && KeyDeltaY <= bound;
    }

    function getCanvasMazePosition(pointer) {
        var canvasX = pointer.pageX - canvasLeft -parseFloat(window.getComputedStyle(document.querySelector('.app')).marginLeft);
        var canvasY = pointer.pageY - canvasTop;
        return {
            x: canvasX - mazeCenter.x,
            y: canvasY - mazeCenter.y,
        };
    }

    canvas.addEventListener('pointerup', function(event) {
        click = false;
        pointerBehavior.pointerUp(event, event);
    });

    canvas.addEventListener('pointermove', function(event) {
        if (click) {
            pointerBehavior.pointerMove(event, event);
        }
    })

    var dragStartPosition, dragStartPegPosition, rotatePointer;

    keyDrug.pointerDown = function(event, pointer) {
        var segments = getKeyConnections();
        if (!segments || !segments.length) {
            return;
        }
        isKeyDragging = true;
        dragStartPosition = {
            x: pointer.pageX,
            y: pointer.pageY
        };
        dragStartPegPosition = {
            x: Key[maze.orientation].x * gridSize + mazeCenter.x,
            y: Key[maze.orientation].y * gridSize + mazeCenter.y,
        };
        docElem.classList.add('is-Key-dragging');
    };

    keyDrug.pointerMove = function(event, pointer) {
        if (!isKeyDragging) {
            return;
        }
        keyDrugMove = {
            x: pointer.pageX - dragStartPosition.x,
            y: pointer.pageY - dragStartPosition.y,
        };
    };

    keyDrug.pointerUp = function() {
        keyDrugMove = null;
        docElem.classList.remove('is-Key-dragging');
        isKeyDragging = false;

        Key.setOffset({
            x: 0,
            y: 0
        }, maze.orientation);

        if (Key.peg.x == maze.goalPosition.x && Key.peg.y == maze.goalPosition.y) {
            completeLevel();
        }
    };

    var dragStartAngle, dragStartMazeAngle, moveAngle;
    var mazeRotate = {};


    mazeRotate.pointerDown = function(event) {
        dragStartAngle = moveAngle = getDragAngle(event);
        dragStartMazeAngle = maze.flyWheel.angle;
        dragAngle = dragStartMazeAngle;
        rotatePointer = event;
    };

    function getDragAngle(pointer) {
        var position = getCanvasMazePosition(pointer);
        return normalizeAngle(Math.atan2(position.y, position.x));
    }

    mazeRotate.pointerMove = function(event) {
        rotatePointer = event;
        moveAngle = getDragAngle(event);
        var deltaAngle = moveAngle - dragStartAngle;
        dragAngle = normalizeAngle(dragStartMazeAngle + deltaAngle);
    };

    mazeRotate.pointerUp = function() {
        dragAngle = null;
        rotatePointer = null;
    };

    function animate() {
        update();
        render();
        requestAnimationFrame(animate);
    }

    function update() {
        dragKey();

        if (dragAngle) {
            maze.flyWheel.setAngle(dragAngle);
        } else {
            maze.attractAlignFlyWheel();
        }
        maze.update();
        if (winAnim) {
            winAnim.update();
        }
    }

    function dragKey() {
        if (!keyDrugMove) {
            return;
        }

        var segments = getKeyConnections();

        var dragPosition = {
            x: dragStartPegPosition.x + keyDrugMove.x,
            y: dragStartPegPosition.y + keyDrugMove.y,
        };

        var dragPeg = getDragPeg(segments, dragPosition);
        Key.setPeg(dragPeg, maze.orientation);

        var keyDrugPosition = getDragPosition(segments, dragPosition);

        var KeyPosition = getKeyPosition();
        var offset = {
            x: keyDrugPosition.x - KeyPosition.x,
            y: keyDrugPosition.y - KeyPosition.y,
        };
        Key.setOffset(offset, maze.orientation);
    }

    function getKeyPosition() {
        return {
            x: Key[maze.orientation].x * gridSize + mazeCenter.x,
            y: Key[maze.orientation].y * gridSize + mazeCenter.y,
        };
    }

    function getKeyConnections() {
        var pegX = Key[maze.orientation].x;
        var pegY = Key[maze.orientation].y;
        var key = maze.orientation + ':' + pegX + ',' + pegY;
        return maze.connections[key];
    }

    function getDragPosition(segments, dragPosition) {
        if (segments.length == 1) {
            return getSegmentDragPosition(segments[0], dragPosition);
        }

        var dragCandidates = segments.map(function(segment) {
            var position = getSegmentDragPosition(segment, dragPosition);
            return {
                position: position,
                distance: getDistance(dragPosition, position),
            };
        });

        dragCandidates.sort(distanceSorter);

        return dragCandidates[0].position;
    }

    function getSegmentDragPosition(segment, dragPosition) {
        var line = segment[maze.orientation];
        var isHorizontal = line.a.y == line.b.y;
        var x, y;
        if (isHorizontal) {
            x = getSegmentDragCoord(line, 'x', dragPosition);
            y = line.a.y * gridSize + mazeCenter.y;
        } else {
            x = line.a.x * gridSize + mazeCenter.x;
            y = getSegmentDragCoord(line, 'y', dragPosition);
        }
        return {
            x: x,
            y: y
        };
    }

    function getSegmentDragCoord(line, axis, dragPosition) {
        var a = line.a[axis];
        var b = line.b[axis];
        var min = a < b ? a : b;
        var max = a > b ? a : b;
        min = min * gridSize + mazeCenter[axis];
        max = max * gridSize + mazeCenter[axis];
        return Math.max(min, Math.min(max, dragPosition[axis]));
    }

    function distanceSorter(a, b) {
        return a.distance - b.distance;
    }

    function getDragPeg(segments, dragPosition) {
        var pegs = [];
        segments.forEach(function(segment) {
            var line = segment[maze.orientation];
            addPegPoint(line.a, pegs);
            addPegPoint(line.b, pegs);
        });

        var pegCandidates = pegs.map(function(pegKey) {
            var parts = pegKey.split(',');
            var peg = {
                x: parseInt(parts[0], 10),
                y: parseInt(parts[1], 10),
            };
            var pegPosition = {
                x: peg.x * gridSize + mazeCenter.x,
                y: peg.y * gridSize + mazeCenter.y,
            };
            return {
                peg: peg,
                distance: getDistance(dragPosition, pegPosition),
            };
        });

        pegCandidates.sort(distanceSorter);

        return pegCandidates[0].peg;
    }

    function getDistance(a, b) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function addPegPoint(point, pegs) {
        var key = point.x + ',' + point.y;
        if (pegs.indexOf(key) == -1) {
            pegs.push(key);
        }
    }


    function onHoverMousemove(event) {
        var isInsideKey = getIsInsideKey(event);
        if (isInsideKey == isKeyHovered) {
            return;
        }
        isKeyHovered = isInsideKey;
        var changeClass = isInsideKey ? 'add' : 'remove';
        docElem.classList[changeClass]('is-Key-hovered');
    }

    function render() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();
        ctx.scale(2, 2);

        maze.render(ctx, mazeCenter, gridSize, maze.flyWheel.angle);

        if (winAnim) {
            winAnim.render(ctx);
        }

        var isHovered = isKeyHovered || isKeyDragging;
        Key.render(ctx, mazeCenter, gridSize, maze.flyWheel.angle, isHovered);
        ctx.restore();
    }

    completedLevels = [];

    function completeLevel() {
        var KeyPosition = getKeyPosition();
        if (completedLevels.indexOf(maze.id) == -1) {
            completedLevels.push(maze.id);
        }
        if (getNextLevel()) {
            nextLevelButton.classList.add('is-open');
        } else {
            wincallback()
        }
    }

    function getNextLevel() {
        var index = levels.indexOf(maze.id);
        return levels[index + 1];
    }

    nextLevelButton.addEventListener('click', function() {
        var nextLevel = getNextLevel();
        if (nextLevel) {
            loadLevel(nextLevel);
        }
    });

    function normalizeAngle(angle) {
        return ((angle % TAU) + TAU) % TAU;
    }
}
