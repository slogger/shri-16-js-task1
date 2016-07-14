// ===================== Пример кода первой двери =======================
/**
 * @class Door0
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */

function doorOpen(door) {
    // setTimeout(function() {
    //     this.unlock()
    // }.bind(door));
}

function addHandlers(elem, startAction, endAction, ctx, type) {
    type = type || 'pointer'
    elem.addEventListener(type + 'down', startAction.bind(ctx));
    elem.addEventListener(type + 'up', endAction.bind(ctx));
    elem.addEventListener(type + 'cancel', endAction.bind(ctx));
    elem.addEventListener(type + 'leave', endAction.bind(ctx));
}

function Door0(number, onUnlock) {
    DoorBase.apply(this, arguments);
    doorOpen(this)
    var buttons = [
        this.popup.querySelector('.door-riddle__button_0')
    ];
    var pointers = {};
    buttons.forEach(function(b) {
        if ('ontouchstart' in document.documentElement) {
            b.addEventListener('pointerdown', _onButtonPointerDownWithTouch.bind(this))
        } else {
            addHandlers(b, _onButtonPointerDownWithoutTouch, _onButtonPointerUpWithoutTouch, this);
        }
    }.bind(this));

    function _onButtonPointerDownWithoutTouch(e) {
        this.unlock();
    }

    function _onButtonPointerUpWithoutTouch(e) {
        if ('ontouchstart' in document.documentElement) {
            e.target.classList.remove('door-riddle__button_pressed');
        }
    }

    function _onButtonPointerDownWithTouch(e) {
        var buttonDims = buttons[0].getBoundingClientRect();
        var buttonCenter = {
            x: buttonDims.left + (buttonDims.width / 2),
            y: buttonDims.top + (buttonDims.height / 2)
        };
        pointers[e.pointerId] = {
            buttonCenter: buttonCenter,

            startVector: {
                x: e.clientX - buttonCenter.x,
                y: e.clientY - buttonCenter.y
            },
            onPointerMove: _onButtonPointerMoveWithTouch.bind(this, e.pointerId),
            onPointerUp: _onButtonPointerUpWithTouch.bind(this, e.pointerId)
        }

        this.popup.addEventListener('pointermove', pointers[e.pointerId].onPointerMove);
        this.popup.addEventListener('pointerup', pointers[e.pointerId].onPointerUp);
    }

    function _onButtonPointerUpWithTouch(pointerId, e) {
        if (pointerId == e.pointerId) {
           this.popup.removeEventListener('pointermove', pointers[pointerId].onPointerMove);
           this.popup.removeEventListener('pointerup', pointers[pointerId].onPointerUp);
           delete pointers[pointerId]
           buttons[0].style.transform = 'scale(4)';
       }
    }

    function _onButtonPointerMoveWithTouch(pointerId, e) {
        if (pointerId !== e.pointerId) return;

        var pointer = pointers[pointerId];

        pointer.currVector = {
            x: e.clientX - pointer.buttonCenter.x,
            y: e.clientY - pointer.buttonCenter.y,
        }

        var a = pointer.startVector;
        var b = pointer.currVector;

        var angle =
            Math.acos((a.x*b.x + a.y*b.y) /
                (Math.sqrt(a.x*a.x + a.y*a.y) * Math.sqrt(b.x*b.x + b.y*b.y)));

        pointer.k = angle / Math.PI;

        var getKoef = function(pointers) {
            // Object.values
            var vals = Object.keys(pointers).map(function (key) {
                return pointers[key];
            });

            var sortedPointers = vals.sort(function(a, b) {
                return a.k - b.k;
            })

            return sortedPointers[0].k;
        }

        k = getKoef(pointers);
        if (Object.keys(pointers).length < 2) return;

        window.requestAnimationFrame(function() {
            buttons[0].style.transform = 'scale(' + (4 - 4*k) + ')';
        });

        if (k >= 0.95) {
            this.unlock();
        }
    }
}

// Наследуемся от класса DoorBase
Door0.prototype = Object.create(DoorBase.prototype);
Door0.prototype.constructor = DoorBase;
// END ===================== Пример кода первой двери =======================

/**
 * @class Door1
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door1(number, onUnlock) {
    doorOpen(this)
    DoorBase.apply(this, arguments);
    this.state = {
        magicWord: false
    }
    var door = this;
    // ==== Напишите свой код для открытия второй двери здесь ====
    function initLatchHandler() {
        var inputRange = door.popup.querySelector('.latch');
        var maxValue = 150;
        var speed = 12;
        var currValue;
        var rafID;
        var recognizer;
        inputRange.min = 0;
        inputRange.max = maxValue;

        function unlockStartHandler(event) {
            window.cancelAnimationFrame(rafID);
            console.log(event);
            if (this.value) {
                currValue = +this.value;
            }
        }

        function unlockEndHandler(event) {
            currValue = +this.value;
            if(currValue >= maxValue) {
                successHandler();
            }
            else {
                rafID = window.requestAnimationFrame(animateHandler);
            }
        }

        function animateHandler() {
            inputRange.value = currValue;
            if(currValue > -1) {
                window.requestAnimationFrame(animateHandler);
            }
            currValue = currValue - speed;
        }

        function successHandler() {
            if (!door.state.magicWord) {
                alert('необходимо сказать волшебное слово')
            } else {
                door.unlock();
            }
            inputRange.value = 0;
        };

        inputRange.addEventListener('mousedown', unlockStartHandler);
        inputRange.addEventListener('mouseup', unlockEndHandler);
        inputRange.addEventListener('mousecancel', unlockEndHandler);
        inputRange.addEventListener('mouseleave', unlockEndHandler);
    }

    function initRecognizer() {
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            door.state.magicWord = true;
        } else {
            recognizer = new SpeechRecognition();
            recognizer.lang = 'ru-RU';
            recognizer.continuous = true;
            recognizer.interimResults = false;
            recognizer.onresult = recognizerHandler;
            recognizer.onerror = function(e){
                if (e.error = 'not-allowed') {
                    door.state.magicWord = true;
                }
            }
            recognizer.start()
        }
    }

    function recognizerHandler(e) {
        var index = e.resultIndex;
        var magicWord = 'сезам откройся';
        var result = e.results[index][0].transcript.trim();
        if (result.toLowerCase().indexOf(magicWord)+1 !== 0) {
            door.state.magicWord = true;
            recognizer.stop();
            alert('я услышал волшебное слово');
            return;
        }
    }

    this.openPopup = function() {
        this.popup.classList.remove('popup_hidden');
        initLatchHandler();
        initRecognizer();
    };

    // ==== END Напишите свой код для открытия второй двери здесь ====
}
Door1.prototype = Object.create(DoorBase.prototype);
Door1.prototype.constructor = DoorBase;

/**
 * @class Door2
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door2(number, onUnlock) {
    DoorBase.apply(this, arguments);
    doorOpen(this)
    this.state = {
        light: 0,
        currentStep: 0
    }
    var door = this;
    // ==== Напишите свой код для открытия третей двери здесь ====
    buttons = [];
    [].forEach.call(this.popup.querySelector('.door-step-wrapper').querySelectorAll('.door-step__button'), function(b) {
        buttons.push({
            node: b,
            step: parseInt(b.getAttribute('data-step')) || 0
        })
        addHandlers(b, _onButtonPointerDown, _onButtonPointerUp, door)
    })
    function _onButtonPointerDown(e) {
        var currentBtnStep = parseInt(e.target.getAttribute('data-step')) || 0;
        if (currentBtnStep === door.state.currentStep) {
            e.target.classList.add('door-step__button_pressed');
            checkCondition.apply(this);
        }
    }

    function _onButtonPointerUp(e) {
        var currentBtnStep = parseInt(e.target.getAttribute('data-step')) || 0;
        if (currentBtnStep >= door.state.currentStep) {
            if ('ontouchstart' in document.documentElement) {
                e.target.classList.remove('door-step__button_pressed');
            }
        }
    }

    function checkCondition() {
        var flag = true;
        var currentStepBtns = buttons.filter(function(b) {return b.step == door.state.currentStep});
        currentStepBtns.forEach(function(b) {
            if (!b.node.classList.contains('door-step__button_pressed')) {
                flag = false;
            }
        });
        if (flag) {
            door.state.currentStep = door.state.currentStep+1;
        }
        if(door.state.currentStep == 6) {
            door.unlock();
        }
    }

    var lightHandler = function (e) {
        door.state.light = e.value;
        renderLight()
    }

    var indicator = door.popup.querySelector('.door-step__indicator');
    var wrap = door.popup.querySelector('.door-step-wrapper');

    function renderLight() {
        var value = door.state.light;
        if (value < 10) {
            wrap.classList.remove('door-step-wrapper--light-on');
        } else {
            wrap.classList.add('door-step-wrapper--light-on');
        }
        var color = 'hsl(44,60%,' + value +'%)'
        indicator.style.backgroundColor = color;
    }
    if ('ondevicelight' in window) {
        window.addEventListener('devicelight', lightHandler);
        window.dispatchEvent(new Event('devicelight'));
    }
    // ==== END Напишите свой код для открытия третей двери здесь ====
}
Door2.prototype = Object.create(DoorBase.prototype);
Door2.prototype.constructor = DoorBase;

/**
 * Сундук
 * @class Box
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Box(number, onUnlock) {
    DoorBase.apply(this, arguments);

    this.openPopup = function() {
        this.popup.classList.remove('popup_hidden');
        GameInit(this.unlock.bind(this));
    };

    this.showCongratulations = function() {
        alert('Поздравляю! Игра пройдена!');
    };
}
Box.prototype = Object.create(DoorBase.prototype);
Box.prototype.constructor = DoorBase;
