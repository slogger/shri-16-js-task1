function GameInit(wincallback) {
    console.log('INIT GAME');
    var docElem = document.documentElement;
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');

    var rootWidth = canvas.parentElement.clientWidth;
    var rootHeight = canvas.parentElement.clientHeight;

    var canvasSize = Math.min(rootWidth, rootHeight);
    // console.log(canvasSize);
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

    // ----- config ----- //

    var gridSize = Math.min(40, canvasSize / 12);
    var mazeCenter = {
        x: canvasWidth / 4,
        y: Math.min(gridSize * 8, canvasHeight / 4)
    };
    // ----- instruction ----- //

    var instructElem = document.querySelector('.instruction');
    instructElem.style.top = (mazeCenter.y + gridSize * 5.5) + 'px';

    // ----- build level select, levels array ----- //

    var levelList = document.querySelector('.level-list');
    var levelsElem = document.querySelector('.levels');
    var levels = [];

    (function() {
        var levelPres = levelsElem.querySelectorAll('pre');
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < levelPres.length; i++) {
            var pre = levelPres[i];
            var listItem = document.createElement('li');
            listItem.className = 'level-list__item';
            var id = pre.id;
            listItem.innerHTML = '<span class="level-list__item__number">' + (i + 1) +
                '</span> <span class="level-list__item__blurb">' +
                pre.getAttribute('data-blurb') + '</span>' +
                '<span class="level-list__item__check">✔</span>';
            listItem.setAttribute('data-id', id);
            fragment.appendChild(listItem);
            levels.push(id);
        }

        levelList.appendChild(fragment);

    })();

    var nextLevelButton = document.querySelector('.next-level-button');
    nextLevelButton.style.top = (mazeCenter.y + gridSize * 5.5) + 'px';

    // ----- level list ----- //

    levelList.addEventListener('click', function(event) {
        var item = getParent(event.target, '.level-list__item');
        if (!item) {
            return;
        }
        // load level from id
        var id = item.getAttribute('data-id');
        loadLevel(id);
    });

    function getParent(elem, selector) {
        var parent = elem;
        console.log(elem, parent);
        while (parent != document.body) {
            if (parent.matches(selector)) {
                return parent;
            }
            parent = parent.parentNode;
        }
    }

    // ----- load level ----- //

    function loadLevel(id) {
        var pre = levelsElem.querySelector('#' + id);

        maze = new Maze();
        maze.id = id;

        if (!pre) {
            console.error('pre not found for ' + id);
            return;
        }

        // load maze level from pre text
        maze.loadText(pre.textContent);
        // close ui
        levelList.classList.remove('is-open');
        nextLevelButton.classList.remove('is-open');
        window.scrollTo(0, 0);
        // highlight list
        var previousItem = levelList.querySelector('.is-playing');
        if (previousItem) {
            previousItem.classList.remove('is-playing');
        }
        levelList.querySelector('[data-id="' + id + '"]').classList.add('is-playing');
    }

    // ----- init ----- //

    loadLevel(levels[0]);

    canvas.addEventListener('pointermove', onHoverMousemove);
    animate();

    // -------------------------- drag rotation -------------------------- //

    var canvasLeft = canvas.offsetLeft;
    var canvasTop = canvas.offsetTop;

    var pointerBehavior;

    // ----- pointerBehavior ----- //

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
        console.log({
            pointer: pointer,
            l: canvasLeft,
            t: canvasTop,
            x: canvasX - mazeCenter.x,
            y: canvasY - mazeCenter.y,
        });
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
        // ----- keyDrug ----- //

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
        // set at peg
        Key.setOffset({
            x: 0,
            y: 0
        }, maze.orientation);
        // check level complete
        if (Key.peg.x == maze.goalPosition.x && Key.peg.y == maze.goalPosition.y) {
            completeLevel();
        }
    };

    // ----- rotate ----- //

    var dragStartAngle, dragStartMazeAngle, moveAngle;
    var mazeRotate = {};


    mazeRotate.pointerDown = function(event, pointer) {
        dragStartAngle = moveAngle = getDragAngle(pointer);
        dragStartMazeAngle = maze.flyWheel.angle;
        dragAngle = dragStartMazeAngle;
        rotatePointer = pointer;
    };

    function getDragAngle(pointer) {
        var position = getCanvasMazePosition(pointer);
        return normalizeAngle(Math.atan2(position.y, position.x));
    }

    mazeRotate.pointerMove = function(event, pointer) {
        rotatePointer = pointer;
        moveAngle = getDragAngle(pointer);
        var deltaAngle = moveAngle - dragStartAngle;
        dragAngle = normalizeAngle(dragStartMazeAngle + deltaAngle);
    };

    mazeRotate.pointerUp = function() {
        dragAngle = null;
        rotatePointer = null;
    };


    // ----- animate ----- //

    function animate() {
        update();
        render();
        requestAnimationFrame(animate);
    }

    // ----- update ----- //

    function update() {
        // drag Key
        dragKey();
        // rotate grid
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

        // set peg position
        var dragPeg = getDragPeg(segments, dragPosition);
        Key.setPeg(dragPeg, maze.orientation);

        // set drag offset
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

        // get closest segments positions
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
            // revert string back to object with integers
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
        // use strings to prevent dupes
        var key = point.x + ',' + point.y;
        if (pegs.indexOf(key) == -1) {
            pegs.push(key);
        }
    }

    // ----- hover ----- //

    function onHoverMousemove(event) {
        var isInsideKey = getIsInsideKey(event);
        if (isInsideKey == isKeyHovered) {
            return;
        }
        // change
        isKeyHovered = isInsideKey;
        var changeClass = isInsideKey ? 'add' : 'remove';
        docElem.classList[changeClass]('is-Key-hovered');
    }

    // ----- render ----- //

    function render() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();
        ctx.scale(2, 2);
        renderRotateHandle();
        // maze
        maze.render(ctx, mazeCenter, gridSize, maze.flyWheel.angle);
        // win animation
        if (winAnim) {
            winAnim.render(ctx);
        }
        // Key
        var isHovered = isKeyHovered || isKeyDragging;
        Key.render(ctx, mazeCenter, gridSize, maze.flyWheel.angle, isHovered);
        ctx.restore();
    }

    function renderRotateHandle() {
        // rotate handle
        if (!rotatePointer) {
            return;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = gridSize * 0.5;
        var color = '#EEE';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // pie slice
        ctx.beginPath();
        var pieRadius = maze.gridMax * gridSize;
        ctx.moveTo(mazeCenter.x, mazeCenter.y);
        var pieDirection = normalizeAngle(normalizeAngle(moveAngle) -
            normalizeAngle(dragStartAngle)) > TAU / 2;
        ctx.arc(mazeCenter.x, mazeCenter.y, pieRadius, dragStartAngle, moveAngle, pieDirection);
        ctx.lineTo(mazeCenter.x, mazeCenter.y);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }

    // -------------------------- completeLevel -------------------------- //

    completedLevels = [];

    completedLevels.forEach(function(id) {
        var item = levelList.querySelector('[data-id="' + id + '"]');
        if (item) {
            item.classList.add('did-complete');
        }
    });

    function completeLevel() {
        var KeyPosition = getKeyPosition();
        levelList.querySelector('[data-id="' + maze.id + '"]').classList.add('did-complete');
        if (completedLevels.indexOf(maze.id) == -1) {
            completedLevels.push(maze.id);
        }
        if (getNextLevel()) {
            setTimeout(function() {
                nextLevelButton.classList.add('is-open');
            }, 1000);
        } else {
            wincallback()
        }
    }

    function getNextLevel() {
        var index = levels.indexOf(maze.id);
        return levels[index + 1];
    }

    // -------------------------- next level -------------------------- //

    nextLevelButton.addEventListener('click', function() {
        var nextLevel = getNextLevel();
        if (nextLevel) {
            loadLevel(nextLevel);
        }
    });

    // -------------------------- utils -------------------------- //

    function normalizeAngle(angle) {
        return ((angle % TAU) + TAU) % TAU;
    }
}
