// ===================== Пример кода первой двери =======================
/**
 * @class Door0
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */

function doorOpen(door) {
    setTimeout(function() {
        this.unlock()
    }.bind(door));
}

function Door0(number, onUnlock) {
    DoorBase.apply(this, arguments);
    doorOpen(this)
    var buttons = [
        this.popup.querySelector('.door-riddle__button_0'),
        this.popup.querySelector('.door-riddle__button_1'),
        this.popup.querySelector('.door-riddle__button_2')
    ];
    buttons.forEach(function(b) {
        b.addEventListener('pointerdown', _onButtonPointerDown.bind(this));
        b.addEventListener('pointerup', _onButtonPointerUp.bind(this));
        b.addEventListener('pointercancel', _onButtonPointerUp.bind(this));
        b.addEventListener('pointerleave', _onButtonPointerUp.bind(this));
    }.bind(this));

    function _onButtonPointerDown(e) {
        console.log(e);
        e.target.classList.add('door-riddle__button_pressed');
        checkCondition.apply(this);
    }

    function _onButtonPointerUp(e) {
        console.log(e);
        console.log(!('ontouchstart' in document.documentElement));
        if ('ontouchstart' in document.documentElement) {
            e.target.classList.remove('door-riddle__button_pressed');
        }
    }

    /**
     * Проверяем, можно ли теперь открыть дверь
     */
    function checkCondition() {
        var isOpened = true;
        buttons.forEach(function(b) {
            if (!b.classList.contains('door-riddle__button_pressed')) {
                isOpened = false;
            }
        });

        // Если все три кнопки зажаты одновременно, то откроем эту дверь
        if (isOpened) {
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

        inputRange.addEventListener('pointerdown', unlockStartHandler);
        inputRange.addEventListener('pointerup', unlockEndHandler);
        inputRange.addEventListener('pointercancel', unlockEndHandler);
        inputRange.addEventListener('pointerleave', unlockEndHandler);
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
            recognizer.start()
        }
    }

    function recognizerHandler(e) {
        var index = e.resultIndex;
        var magicWord = 'сезам откройся';
        var result = e.results[index][0].transcript.trim();
        console.log(result);
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
        b.addEventListener('pointerdown', _onButtonPointerDown.bind(door));
        b.addEventListener('pointerup', _onButtonPointerUp.bind(door));
        b.addEventListener('pointercancel', _onButtonPointerUp.bind(door));
        b.addEventListener('pointerleave', _onButtonPointerUp.bind(door));
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
        console.log(flag, door.state.currentStep, currentStepBtns.length);
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
