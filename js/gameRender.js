function FixedSegment(a, b) {
    this.type = 'FixedSegment';
    this.a = a;
    this.b = b;

    this.noon = {
        a: a,
        b: b
    };
    this.three = {
        a: a,
        b: b
    };
    this.six = {
        a: a,
        b: b
    };
    this.nine = {
        a: a,
        b: b
    };
}

var proto = FixedSegment.prototype;

proto.render = function(ctx, center, gridSize) {
    var ax = this.a.x * gridSize;
    var ay = this.a.y * gridSize;
    var bx = this.b.x * gridSize;
    var by = this.b.y * gridSize;
    ctx.strokeStyle = 'hsla(30, 100%, 40%, 0.6)';
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.closePath();
};

var TAU = Math.PI * 2;

function FlyWheel(props) {
    this.angle = 0;
    this.friction = 0.95;
    this.velocity = 0;

    for (var prop in props) {
        this[prop] = props[prop];
    }
}

var proto = FlyWheel.prototype;

proto.integrate = function() {
    this.velocity *= this.friction;
    this.angle += this.velocity;
    this.normalizeAngle();
};

proto.applyForce = function(force) {
    this.velocity += force;
};

proto.normalizeAngle = function() {
    this.angle = ((this.angle % TAU) + TAU) % TAU;
};

proto.setAngle = function(theta) {
    var velo = theta - this.angle;
    if (velo > TAU / 2) {
        velo -= TAU;
    } else if (velo < -TAU / 2) {
        velo += TAU;
    }
    var force = velo - this.velocity;
    this.applyForce(force);
};

var Key = {
    offset: {
        x: 0,
        y: 0
    },
};

var pegOrienter = {
    noon: function(peg) {
        return peg;
    },
    three: function(peg) {
        return {
            x: peg.y,
            y: -peg.x
        };
    },
    six: function(peg) {
        return {
            x: -peg.x,
            y: -peg.y
        };
    },
    nine: function(peg) {
        return {
            x: -peg.y,
            y: peg.x
        };
    },
};

Key.setPeg = function(peg, orientation) {
    peg = pegOrienter[orientation](peg);
    this.peg = peg;

    this.noon = {
        x: peg.x,
        y: peg.y
    };
    this.three = {
        x: -peg.y,
        y: peg.x
    };
    this.six = {
        x: -peg.x,
        y: -peg.y
    };
    this.nine = {
        x: peg.y,
        y: -peg.x
    };
};

var offsetOrienter = {
    noon: function(offset) {
        return offset;
    },
    three: function(offset) {
        return {
            x: offset.y,
            y: -offset.x
        };
    },
    six: function(offset) {
        return {
            x: -offset.x,
            y: -offset.y
        };
    },
    nine: function(offset) {
        return {
            x: -offset.y,
            y: offset.x
        };
    },
};

Key.setOffset = function(offset, orientation) {
    this.offset = offsetOrienter[orientation](offset);
};

Key.render = function(ctx, mazeCenter, gridSize, angle, isHovered) {
    var x = this.peg.x * gridSize + this.offset.x;
    var y = this.peg.y * gridSize + this.offset.y;
    drawing = new Image();
    drawing.src = "img/keyRed.png";
    ctx.save();
    ctx.translate(mazeCenter.x, mazeCenter.y);
    ctx.rotate(angle);
    ctx.translate(x, y);
    ctx.rotate(-angle);
    var size = 64;
    ctx.scale(1, 1);
    ctx.drawImage(drawing, -(size / 2), -(size / 2), size, size);
    ctx.restore();
};

function Maze() {
    this.fixedSegments = [];
    this.flyWheel = new FlyWheel({
        friction: 0.8
    });
    this.connections = {};
}

var proto = Maze.prototype;

proto.loadText = function(mazeSrc) {
    var lines = mazeSrc.split('\n');
    var gridCount = this.gridCount = lines[0].length;
    var gridMax = this.gridMax = (gridCount - 1) / 2;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var chars = line.split('');
        for (var j = 0; j < chars.length; j++) {
            var character = chars[j];
            var pegX = j - gridMax;
            var pegY = i - gridMax;
            var parseMethod = 'parse' + character;
            if (this[parseMethod]) {
                this[parseMethod](pegX, pegY);
            }
        }
    }
};

proto['parse='] = proto.addFixedHorizSegment = function(pegX, pegY) {
    var segment = getHorizSegment(pegX, pegY, FixedSegment);
    this.connectSegment(segment);
    this.fixedSegments.push(segment);
};

proto['parse!'] = proto.addFixedVertSegment = function(pegX, pegY) {
    var segment = getVertSegment(pegX, pegY, FixedSegment);
    this.connectSegment(segment);
    this.fixedSegments.push(segment);
};

function getHorizSegment(pegX, pegY, Segment) {
    var a = {
        x: pegX + 1,
        y: pegY
    };
    var b = {
        x: pegX - 1,
        y: pegY
    };
    return new Segment(a, b);
}

function getVertSegment(pegX, pegY, Segment) {
    var a = {
        x: pegX,
        y: pegY + 1
    };
    var b = {
        x: pegX,
        y: pegY - 1
    };
    return new Segment(a, b);
}

proto['parse@'] = function(pegX, pegY) {
    this.startPosition = {
        x: pegX,
        y: pegY
    };
    Key.setPeg(this.startPosition, 'noon');
};

proto['parse*'] = function(pegX, pegY) {
    this.goalPosition = {
        x: pegX,
        y: pegY
    };
};

proto.updateItemGroups = function() {
    var itemGroups = {};
    this.items.forEach(function(item) {
        if (itemGroups[item.type] === undefined) {
            itemGroups[item.type] = [];
        }
        itemGroups[item.type].push(item);
    });
    this.itemGroups = itemGroups;
};

var orientations = ['noon', 'three', 'six', 'nine'];

proto.connectSegment = function(segment) {
    orientations.forEach(function(orientation) {
        var line = segment[orientation];

        if (this.getIsPegOut(line.a) || this.getIsPegOut(line.b)) {
            return;
        }
        this.connectPeg(segment, orientation, line.a);
        this.connectPeg(segment, orientation, line.b);
    }, this);
};

proto.getIsPegOut = function(peg) {
    return Math.abs(peg.x) > this.gridMax ||
        Math.abs(peg.y) > this.gridMax;
};

proto.connectPeg = function(segment, orientation, peg) {
    var key = orientation + ':' + peg.x + ',' + peg.y;
    var connection = this.connections[key];

    if (!connection) {
        connection = this.connections[key] = [];
    }
    if (connection.indexOf(segment) == -1) {
        connection.push(segment);
    }
};

proto.update = function() {
    this.flyWheel.integrate();
    var angle = this.flyWheel.angle;
    if (angle < TAU / 8) {
        this.orientation = 'noon';
    } else if (angle < TAU * 3 / 8) {
        this.orientation = 'three';
    } else if (angle < TAU * 5 / 8) {
        this.orientation = 'six';
    } else if (angle < TAU * 7 / 8) {
        this.orientation = 'nine';
    } else {
        this.orientation = 'noon';
    }
};

proto.attractAlignFlyWheel = function() {
    var angle = this.flyWheel.angle;
    var target;
    if (angle < TAU / 8) {
        target = 0;
    } else if (angle < TAU * 3 / 8) {
        target = TAU / 4;
    } else if (angle < TAU * 5 / 8) {
        target = TAU / 2;
    } else if (angle < TAU * 7 / 8) {
        target = TAU * 3 / 4;
    } else {
        target = TAU;
    }
    var attraction = (target - angle) * 0.03;
    this.flyWheel.applyForce(attraction);
};

var TAU = Math.PI * 2;

var orientationAngles = {
    noon: 0,
    three: TAU / 4,
    six: TAU / 2,
    nine: TAU * 3 / 4
};

proto.render = function(ctx, center, gridSize, angle) {
    var orientationAngle = orientationAngles[angle];
    var gridMax = this.gridMax;
    angle = orientationAngle !== undefined ? orientationAngle : angle || 0;

    ctx.save();
    ctx.translate(center.x, center.y);

    this.fixedSegments.forEach(function(segment) {
        segment.render(ctx, center, gridSize);
    });

    ctx.rotate(angle);

    ctx.lineWidth = gridSize * 0.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineWidth = gridSize * 0.2;
    ctx.strokeStyle = 'hsla(0, 0%, 50%, 0.2)';
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-gridSize / 5, -gridSize / 5, gridSize * 2 / 5, gridSize * 2 / 5);
    ctx.restore();

    for (var pegY = -gridMax; pegY <= gridMax; pegY += 2) {
        for (var pegX = -gridMax; pegX <= gridMax; pegX += 2) {
            var pegXX = pegX * gridSize;
            var pegYY = pegY * gridSize;
            ctx.fillStyle = 'hsla(0, 0%, 50%, 0.6)';
            fillCircle(ctx, pegXX, pegYY, gridSize * 0.15);
        }
    }
    var goalX = this.goalPosition.x * gridSize;
    var goalY = this.goalPosition.y * gridSize;
    ctx.lineWidth = gridSize * 0.3;
    ctx.fillStyle = 'hsla(50, 100%, 50%, 1)';
    ctx.strokeStyle = 'hsla(50, 100%, 50%, 1)';
    renderGoal(ctx, goalX, goalY, angle, gridSize * 0.6, gridSize * 0.3);

    ctx.restore();
};

function fillCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function strokeCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
}

function renderGoal(ctx, x, y, mazeAngle, radiusA, radiusB) {
    drawing = new Image();
    drawing.src = "img/lockRed.png";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-mazeAngle);
    var size = 48
    ctx.drawImage(drawing, -(size / 2), -(size / 2), size, size);
    ctx.restore();
}
