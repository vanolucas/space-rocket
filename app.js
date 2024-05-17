'use strict';

// Get canvas.
const glCanvas = document.getElementById('gl-canvas');
const frontCanvas = document.getElementById('front-canvas');

const ctx = frontCanvas.getContext('2d');
ctx.fillStyle = "rgba(255,0,255,0.25)";

glCanvas.width = glCanvas.clientWidth;
glCanvas.height = glCanvas.clientHeight;

frontCanvas.width = frontCanvas.clientWidth;
frontCanvas.height = frontCanvas.clientHeight;

// Current control input keys state.
class InputState {
    constructor() {
        this.forward = false;
        this.counterClockwise = false;
        this.brake = false;
        this.clockwise = false;
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.shoot = false;
    }

    keyDown(key) {
        switch (key) {
            case 'ArrowUp':
                this.forward = true;
                break;
            case 'ArrowDown':
                this.brake = true;
                break;
            case 'ArrowLeft':
                this.counterClockwise = true;
                break;
            case 'ArrowRight':
                this.clockwise = true;
                break;
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                this.up = true;
                break;
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                this.left = true;
                break;
            case 's':
            case 'S':
                this.down = true;
                break;
            case 'd':
            case 'D':
                this.right = true;
                break;
            case ' ':
            case 'e':
                this.shoot = true;
                break;
        }
    }

    keyUp(key) {
        switch (key) {
            case 'ArrowUp':
                this.forward = false;
                break;
            case 'ArrowDown':
                this.brake = false;
                break;
            case 'ArrowLeft':
                this.counterClockwise = false;
                break;
            case 'ArrowRight':
                this.clockwise = false;
                break;
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                this.up = false;
                break;
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                this.left = false;
                break;
            case 's':
            case 'S':
                this.down = false;
                break;
            case 'd':
            case 'D':
                this.right = false;
                break;
            case ' ':
            case 'e':
                this.shoot = false;
                break;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        let textY = 20;
        for (const attr in this) {
            if (this.hasOwnProperty(attr)) {
                ctx.fillText(`${attr}: ${this[attr]}`, 10, textY);
                textY += 20;
            }
        }
    }
}
const inputState = new InputState();

// The game world.
class World {
    draw(ctx) {
        const circleColorScheme = {
            r: 200,
            g: 50,
            b: 30,
            a: 0.90
        }

        // Draw left circle.
        ctx.beginPath();
        ctx.arc(frontCanvas.width / 3, frontCanvas.height / 2, 100, 0, Math.PI * 2, false);
        var gradient = ctx.createLinearGradient(frontCanvas.width / 3 - 100, frontCanvas.height / 2 - 50, frontCanvas.width / 3 + 100, frontCanvas.height / 2 + 50);
        gradient.addColorStop(0, `rgba(${circleColorScheme.r}, ${circleColorScheme.g}, ${circleColorScheme.b}, ${circleColorScheme.a})`);
        gradient.addColorStop(0.5, `rgba(${circleColorScheme.b}, ${circleColorScheme.g}, ${circleColorScheme.r}, ${circleColorScheme.a})`);
        gradient.addColorStop(1, `rgba(${circleColorScheme.r}, ${circleColorScheme.g}, ${circleColorScheme.b}, ${circleColorScheme.a})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();

        // Draw right circle.
        ctx.beginPath();
        ctx.arc(2 * frontCanvas.width / 3, frontCanvas.height / 2, 100, 0, Math.PI * 2, false);
        gradient = ctx.createLinearGradient(2 * frontCanvas.width / 3 - 100, frontCanvas.height / 2 - 50, 2 * frontCanvas.width / 3 + 100, frontCanvas.height / 2 + 50);
        gradient.addColorStop(0, `rgba(${circleColorScheme.r}, ${circleColorScheme.g}, ${circleColorScheme.b}, ${circleColorScheme.a})`);
        gradient.addColorStop(0.5, `rgba(${circleColorScheme.b}, ${circleColorScheme.g}, ${circleColorScheme.r}, ${circleColorScheme.a})`);
        gradient.addColorStop(1, `rgba(${circleColorScheme.r}, ${circleColorScheme.g}, ${circleColorScheme.b}, ${circleColorScheme.a})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
    }
}
const world = new World()

var count = 0;
var colorArr = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];

const bounceOnFloorAndCeiling = false;
const bounceOnWalls = true;

// The player's rocket.
class Rocket {
    constructor(canvas) {
        this.width = 70;
        this.height = 70;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.xVelocity = 0.0;
        this.yVelocity = 0.0;
        this.angle = -90;
        this.rotationVelocity = 0.0;
        this.velocityFriction = 0.98;
        this.rotationFriction = 0.96;
        this.minVelocity = 0.04;
        this.maxVelocity = 10.0;
        this.thrust = 0.5;
        this.rotationThrust = 0.4;
        this.reverseThrust = 0.1;
        this.brakeForce = 0.1;
        this.rotationBrakeForce = 0.1;
        this.reversing = false;
        this.smokeCurl = 20;
        this.smokeSplatRadius = 0.0005;
        this.bulletInitialVelocity = this.maxVelocity + 20.0;
        this.bulletReloadMs = 150;
        this.img = new Image();
        this.img.src = "assets/rocket.png"

        this.lastBullet = null;
    }

    updateState(inputState) {
        // Update vertical velocity based on pressed keys.
        if (inputState.up && !inputState.down && this.yVelocity > -this.maxVelocity) {
            this.yVelocity -= this.thrust;
            this.reversing = false;
        } else if (!inputState.up && inputState.down && this.yVelocity < this.maxVelocity) {
            this.yVelocity += this.thrust;
            this.reversing = false;
        }

        // Update horizontal velocity based on pressed keys.
        if (inputState.left && !inputState.right && this.xVelocity > -this.maxVelocity) {
            this.xVelocity -= this.thrust;
            this.reversing = false;
        } else if (!inputState.left && inputState.right && this.xVelocity < this.maxVelocity) {
            this.xVelocity += this.thrust;
            this.reversing = false;
        }

        // Update rotation velocity based on pressed keys.
        if (inputState.counterClockwise && !inputState.clockwise && this.rotationVelocity > -this.maxVelocity) {
            this.rotationVelocity -= this.rotationThrust;
        } else if (!inputState.counterClockwise && inputState.clockwise && this.rotationVelocity < this.maxVelocity) {
            this.rotationVelocity += this.rotationThrust;
        }

        // When forward key is pressed, increase velocity in the direction the rocket is facing.
        if (inputState.forward && !inputState.brake) {
            // Calculate the change in x and y velocity.
            const angleInRadians = this.angle * Math.PI / 180;
            const dx = Math.cos(angleInRadians) * this.thrust;
            const dy = Math.sin(angleInRadians) * this.thrust;

            // Update the velocity.
            this.xVelocity += dx;
            this.yVelocity += dy;

            this.reversing = false;
        }

        // When brake key is pressed, brake.
        if (inputState.brake) {
            // If we are already still, go backward.
            if (!inputState.forward && ((this.xVelocity == 0.0 && this.yVelocity == 0.0) || this.reversing)) {
                // Enter reversing state.
                this.reversing = true;

                // Calculate the change in x and y velocity.
                const angleInRadians = this.angle * Math.PI / 180;
                const dx = Math.cos(angleInRadians) * -this.reverseThrust;
                const dy = Math.sin(angleInRadians) * -this.reverseThrust;

                // Update the velocity.
                this.xVelocity += dx;
                this.yVelocity += dy;
                this.rotationVelocity *= 1.0 - this.rotationBrakeForce;
            }
            // Else just brake.
            else {
                this.xVelocity *= 1.0 - this.brakeForce;
                this.yVelocity *= 1.0 - this.brakeForce;
                this.rotationVelocity *= 1.0 - this.rotationBrakeForce;
            }
        }

        // Apply friction.
        this.xVelocity *= this.velocityFriction;
        this.yVelocity *= this.velocityFriction;
        this.rotationVelocity *= this.rotationFriction;

        // Apply min velocity threshold.
        if (Math.abs(this.xVelocity) < this.minVelocity) {
            this.xVelocity = 0.0;
        }
        if (Math.abs(this.yVelocity) < this.minVelocity) {
            this.yVelocity = 0.0;
        }
        if (Math.abs(this.rotationVelocity) < this.minVelocity) {
            this.rotationVelocity = 0.0;
        }

        // Update location based on velocity.
        this.x = this.x + this.xVelocity;
        this.y = this.y + this.yVelocity;

        // Update angle based on rotation velocity.
        this.angle = this.angle + this.rotationVelocity;

        // Bounce off floor and ceiling.
        if (bounceOnFloorAndCeiling) {
            // Bounce on ceiling.
            if (this.y - this.height / 2 < 0.0 && this.yVelocity < 0.0) {
                this.y = Math.abs(this.y);
                this.yVelocity = -this.yVelocity;
                this.angle = -this.angle;
            }
            // Bounce on floor.
            else if (this.y + this.height / 2 > frontCanvas.height && this.yVelocity > 0.0) {
                this.y = frontCanvas.height - Math.abs(this.y - frontCanvas.height);
                this.yVelocity = -this.yVelocity;
                this.angle = -this.angle;
            }
        }
        // Else, re-enter on the opposite side.
        else {
            // Exit from ceiling.
            if (this.y + this.height / 2 < 0.0 && this.yVelocity < 0.0) {
                // Re-enter from floor.
                this.y = frontCanvas.height + Math.abs(this.y);
            }
            // Exit from floor.
            else if (this.y - this.height / 2 > frontCanvas.height && this.yVelocity > 0.0) {
                // Re-enter from ceiling.
                this.y = 0 - Math.abs(this.y - frontCanvas.height);
            }
        }
        // Bounce off walls.
        if (bounceOnWalls) {
            // Bounce on left wall.
            if (this.x - this.width / 2 < 0.0 && this.xVelocity < 0.0) {
                this.x = Math.abs(this.x);
                this.xVelocity = -this.xVelocity;
                this.angle = 180 - this.angle;
            }
            // Bounce on right wall.
            else if (this.x + this.width / 2 > frontCanvas.width && this.xVelocity > 0.0) {
                this.x = frontCanvas.width - Math.abs(this.x - frontCanvas.width);
                this.xVelocity = -this.xVelocity;
                this.angle = 180 - this.angle;
            }
        }
        // Else, re-enter on the opposite side.
        else {
            // Exit from left wall.
            if (this.x + this.width / 2 < 0.0 && this.xVelocity < 0.0) {
                // Re-enter from right wall.
                this.x = frontCanvas.width + Math.abs(this.x);
            }
            // Exit from right wall.
            else if (this.x - this.width / 2 > frontCanvas.width && this.xVelocity > 0.0) {
                // Re-enter from left wall.
                this.x = 0 - Math.abs(this.x - frontCanvas.width);
            }
        }
    
        // When shoot key is pressed, shoot bullet.
        if (inputState.shoot) {
            this.shootBullet();
        }
    }

    draw(ctx, enableDebugPrint = false) {
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 180 * (this.angle + 90));
        ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Print debug info.
        if (enableDebugPrint) {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            let textY = 20;
            for (const attr in this) {
                if (this.hasOwnProperty(attr)) {
                    ctx.fillText(`${attr}: ${this[attr]}`, 10, textY);
                    textY += 20;
                }
            }
        }
    }

    shootBullet() {
        // Check that we are allowed to shoot now.
        if (this.lastBullet != null && this.lastBullet.shootTime > new Date() - this.bulletReloadMs) {
            return;
        }
        // Calculate the bullet's initial velocity.
        const angleInRadians = this.angle * Math.PI / 180;
        const xVelocity = Math.cos(angleInRadians) * this.bulletInitialVelocity;
        const yVelocity = Math.sin(angleInRadians) * this.bulletInitialVelocity;
        // Create the bullet.
        const bullet = new Bullet(
            this,
            xVelocity + this.xVelocity,
            yVelocity + this.yVelocity,
            -this.rotationVelocity
        );
        // Publish the bullet to the world.
        this.lastBullet = bullet;
        bullets.push(bullet);
    }

    emitSmoke(inputState) {
        // Emit smoke when thrusting forward or reversing.
        if (inputState.forward || inputState.brake) {
            // Make smoke smaller when reversing.
            this.smokeCurl = (inputState.brake)? 10 : 20;
            this.smokeSplatRadius = (inputState.brake)? 0.0001 : 0.0005;
            const distanceFromRocket = (inputState.brake)? 10 : 20;

            count++;

            const changeColorEvery = 20;
            (count > changeColorEvery) && (colorArr = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2], count = 0);

            pointers[0].down = true;
            pointers[0].color = colorArr;
            pointers[0].moved = pointers[0].down;

            const velocityAngle = Math.atan2(this.xVelocity, this.yVelocity);
            const thrustAngle = (inputState.brake) ? velocityAngle : 180;

            // Calculate the position of the rocket's tail.
            const angleInRadians = (this.angle + thrustAngle) * Math.PI / 180; // Adjust for the rocket's visual orientation  
            const tailOffset = this.height / 2 + distanceFromRocket; // Adjust this value to get the smoke to start from the tail  
            const tailX = this.x + Math.cos(angleInRadians) * tailOffset;
            const tailY = this.y + Math.sin(angleInRadians) * tailOffset;

            pointers[0].dx = (tailX - pointers[0].x) * 10.0;
            pointers[0].dy = (tailY - pointers[0].y) * 10.0;
            pointers[0].x = tailX;
            pointers[0].y = tailY;
        }
    }

}
const rocket = new Rocket(frontCanvas);

class Bullet {
    constructor(rocket, xVelocity, yVelocity, rotationVelocity) {
        this.width = 40;
        this.height = 40;
        this.x = rocket.x;
        this.y = rocket.y;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
        this.angle = rocket.angle - 90;
        this.rotationVelocity = rotationVelocity;
        this.velocityFriction = 0.995;
        this.rotationFriction = 0.995;
        this.minVelocity = 0.04;
        this.maxVelocity = 35.0;
        this.lifetimeMs = 15 * 1000;
        this.img = new Image();
        this.img.src = "assets/bullet.png"

        this.shootTime = new Date();
    }

    updateState() {
        // Apply friction.
        this.xVelocity *= this.velocityFriction;
        this.yVelocity *= this.velocityFriction;
        this.rotationVelocity *= this.rotationFriction;

        // Apply min velocity threshold.
        if (Math.abs(this.xVelocity) < this.minVelocity) {
            this.xVelocity = 0.0;
        }
        if (Math.abs(this.yVelocity) < this.minVelocity) {
            this.yVelocity = 0.0;
        }
        if (Math.abs(this.rotationVelocity) < this.minVelocity) {
            this.rotationVelocity = 0.0;
        }

        // Update location based on velocity.
        this.x = this.x + this.xVelocity;
        this.y = this.y + this.yVelocity;

        // Update angle based on rotation velocity.
        this.angle = this.angle + this.rotationVelocity;

        // Bounce on ceiling.
        if (this.y - this.height / 2 < 0.0 && this.yVelocity < 0.0) {
            this.y = Math.abs(this.y);
            this.yVelocity = -this.yVelocity;
            this.angle = (180 - this.angle);
        }
        // Bounce on floor.
        else if (this.y + this.height / 2 > frontCanvas.height && this.yVelocity > 0.0) {
            this.y = frontCanvas.height - Math.abs(this.y - frontCanvas.height);
            this.yVelocity = -this.yVelocity;
            this.angle = (180 - this.angle);
        }

        // Bounce on left wall.
        if (this.x - this.width / 2 < 0.0 && this.xVelocity < 0.0) {
            this.x = Math.abs(this.x);
            this.xVelocity = -this.xVelocity;
            this.angle = -this.angle;
        }
        // Bounce on right wall.
        else if (this.x + this.width / 2 > frontCanvas.width && this.xVelocity > 0.0) {
            this.x = frontCanvas.width - Math.abs(this.x - frontCanvas.width);
            this.xVelocity = -this.xVelocity;
            this.angle = -this.angle;
        }
    }

    draw(ctx, enableDebugPrint = false) {
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 180 * (this.angle + 90));
        ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Print debug info.
        if (enableDebugPrint) {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            let textY = 20;
            for (const attr in this) {
                if (this.hasOwnProperty(attr)) {
                    ctx.fillText(`${attr}: ${this[attr]}`, 10, textY);
                    textY += 20;
                }
            }
        }
    }

    expired(now = new Date()) {
        return this.shootTime < now - this.lifetimeMs;
    }

    isOffScreen() {
        return this.x < 0.0 || this.y < 0.0 || this.x > frontCanvas.width || this.y > frontCanvas.height;
    }
}
let bullets = [];

function onKeyDown(event) {
    // Update input state.
    inputState.keyDown(event.key);
}

function onKeyUp(event) {
    // Update input state.
    inputState.keyUp(event.key);
}

var config = {
    TEXTURE_DOWNSAMPLE: 1,
    DENSITY_DISSIPATION: 0.99,
    VELOCITY_DISSIPATION: 0.985,
    PRESSURE_DISSIPATION: 0.4,
    PRESSURE_ITERATIONS: 25
    // CURL: 20,
    // SPLAT_RADIUS: 0.0005
};

var pointers = [];
var splatStack = [];

var _getWebGLContext = getWebGLContext(glCanvas);
var gl = _getWebGLContext.gl;
var ext = _getWebGLContext.ext;
var support_linear_float = _getWebGLContext.support_linear_float;

function getWebGLContext(canvas) {

    var params = {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false
    };

    var gl = canvas.getContext('webgl2', params);

    var isWebGL2 = !!gl;

    if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    var halfFloat = gl.getExtension('OES_texture_half_float');
    var support_linear_float = gl.getExtension('OES_texture_half_float_linear');

    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        support_linear_float = gl.getExtension('OES_texture_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    var internalFormat = isWebGL2 ? gl.RGBA16F : gl.RGBA;
    var internalFormatRG = isWebGL2 ? gl.RG16F : gl.RGBA;
    var formatRG = isWebGL2 ? gl.RG : gl.RGBA;
    var texType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

    return {
        gl: gl,
        ext: {
            internalFormat: internalFormat,
            internalFormatRG: internalFormatRG,
            formatRG: formatRG,
            texType: texType
        },
        support_linear_float: support_linear_float
    };
}

function pointerPrototype() {
    this.id = -1;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
}

pointers.push(new pointerPrototype());

var GLProgram = function () {

    function GLProgram(vertexShader, fragmentShader) {

        if (!(this instanceof GLProgram))
            throw new TypeError("Cannot call a class as a function");

        this.uniforms = {};
        this.program = gl.createProgram();

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw gl.getProgramInfoLog(this.program);

        var uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

        for (var i = 0; i < uniformCount; i++) {

            var uniformName = gl.getActiveUniform(this.program, i).name;

            this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);

        }
    }

    GLProgram.prototype.bind = function bind() {
        gl.useProgram(this.program);
    };

    return GLProgram;

}();

function compileShader(type, source) {

    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);

    return shader;

}

var baseVertexShader = compileShader(gl.VERTEX_SHADER, 'precision highp float; precision mediump sampler2D; attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform vec2 texelSize; void main () {     vUv = aPosition * 0.5 + 0.5;     vL = vUv - vec2(texelSize.x, 0.0);     vR = vUv + vec2(texelSize.x, 0.0);     vT = vUv + vec2(0.0, texelSize.y);     vB = vUv - vec2(0.0, texelSize.y);     gl_Position = vec4(aPosition, 0.0, 1.0); }');
var clearShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTexture; uniform float value; void main () {     gl_FragColor = value * texture2D(uTexture, vUv); }');
var displayShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTexture; void main () {     gl_FragColor = texture2D(uTexture, vUv); }');
var splatShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius; void main () {     vec2 p = vUv - point.xy;     p.x *= aspectRatio;     vec3 splat = exp(-dot(p, p) / radius) * color;     vec3 base = texture2D(uTarget, vUv).xyz;     gl_FragColor = vec4(base + splat, 1.0); }');
var advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation; vec4 bilerp (in sampler2D sam, in vec2 p) {     vec4 st;     st.xy = floor(p - 0.5) + 0.5;     st.zw = st.xy + 1.0;     vec4 uv = st * texelSize.xyxy;     vec4 a = texture2D(sam, uv.xy);     vec4 b = texture2D(sam, uv.zy);     vec4 c = texture2D(sam, uv.xw);     vec4 d = texture2D(sam, uv.zw);     vec2 f = p - st.xy;     return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); } void main () {     vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;     gl_FragColor = dissipation * bilerp(uSource, coord);     gl_FragColor.a = 1.0; }');
var advectionShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation; void main () {     vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;     gl_FragColor = dissipation * texture2D(uSource, coord); }');
var divergenceShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; vec2 sampleVelocity (in vec2 uv) {     vec2 multiplier = vec2(1.0, 1.0);     if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }     if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }     if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }     if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }     return multiplier * texture2D(uVelocity, uv).xy; } void main () {     float L = sampleVelocity(vL).x;     float R = sampleVelocity(vR).x;     float T = sampleVelocity(vT).y;     float B = sampleVelocity(vB).y;     float div = 0.5 * (R - L + T - B);     gl_FragColor = vec4(div, 0.0, 0.0, 1.0); }');
var curlShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; void main () {     float L = texture2D(uVelocity, vL).y;     float R = texture2D(uVelocity, vR).y;     float T = texture2D(uVelocity, vT).x;     float B = texture2D(uVelocity, vB).x;     float vorticity = R - L - T + B;     gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0); }');
var vorticityShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt; void main () {     float L = texture2D(uCurl, vL).y;     float R = texture2D(uCurl, vR).y;     float T = texture2D(uCurl, vT).x;     float B = texture2D(uCurl, vB).x;     float C = texture2D(uCurl, vUv).x;     vec2 force = vec2(abs(T) - abs(B), abs(R) - abs(L));     force *= 1.0 / length(force + 0.00001) * curl * C;     vec2 vel = texture2D(uVelocity, vUv).xy;     gl_FragColor = vec4(vel + force * dt, 0.0, 1.0); }');
var pressureShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uPressure; uniform sampler2D uDivergence; vec2 boundary (in vec2 uv) {     uv = min(max(uv, 0.0), 1.0);     return uv; } void main () {     float L = texture2D(uPressure, boundary(vL)).x;     float R = texture2D(uPressure, boundary(vR)).x;     float T = texture2D(uPressure, boundary(vT)).x;     float B = texture2D(uPressure, boundary(vB)).x;     float C = texture2D(uPressure, vUv).x;     float divergence = texture2D(uDivergence, vUv).x;     float pressure = (L + R + B + T - divergence) * 0.25;     gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0); }');
var gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, 'precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uPressure; uniform sampler2D uVelocity; vec2 boundary (in vec2 uv) {     uv = min(max(uv, 0.0), 1.0);     return uv; } void main () {     float L = texture2D(uPressure, boundary(vL)).x;     float R = texture2D(uPressure, boundary(vR)).x;     float T = texture2D(uPressure, boundary(vT)).x;     float B = texture2D(uPressure, boundary(vB)).x;     vec2 velocity = texture2D(uVelocity, vUv).xy;     velocity.xy -= vec2(R - L, T - B);     gl_FragColor = vec4(velocity, 0.0, 1.0); }');

var textureWidth = void 0;
var textureHeight = void 0;
var density = void 0;
var velocity = void 0;
var divergence = void 0;
var curl = void 0;
var pressure = void 0;

initFramebuffers();

var clearProgram = new GLProgram(baseVertexShader, clearShader);
var displayProgram = new GLProgram(baseVertexShader, displayShader);
var splatProgram = new GLProgram(baseVertexShader, splatShader);
var advectionProgram = new GLProgram(baseVertexShader, support_linear_float ? advectionShader : advectionManualFilteringShader);
var divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
var curlProgram = new GLProgram(baseVertexShader, curlShader);
var vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
var pressureProgram = new GLProgram(baseVertexShader, pressureShader);
var gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);

function initFramebuffers() {

    textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
    textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;

    var iFormat = ext.internalFormat;
    var iFormatRG = ext.internalFormatRG;
    var formatRG = ext.formatRG;
    var texType = ext.texType;

    density = createDoubleFBO(0, textureWidth, textureHeight, iFormat, gl.RGBA, texType, support_linear_float ? gl.LINEAR : gl.NEAREST);
    velocity = createDoubleFBO(2, textureWidth, textureHeight, iFormatRG, formatRG, texType, support_linear_float ? gl.LINEAR : gl.NEAREST);
    divergence = createFBO(4, textureWidth, textureHeight, iFormatRG, formatRG, texType, gl.NEAREST);
    curl = createFBO(5, textureWidth, textureHeight, iFormatRG, formatRG, texType, gl.NEAREST);
    pressure = createDoubleFBO(6, textureWidth, textureHeight, iFormatRG, formatRG, texType, gl.NEAREST);

}

function createFBO(texId, w, h, internalFormat, format, type, param) {

    gl.activeTexture(gl.TEXTURE0 + texId);

    var texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    var fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return [texture, fbo, texId];

}

function createDoubleFBO(texId, w, h, internalFormat, format, type, param) {

    var fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
    var fbo2 = createFBO(texId + 1, w, h, internalFormat, format, type, param);

    return {
        get first() {
            return fbo1;
        },
        get second() {
            return fbo2;
        },
        swap: function swap() {
            var temp = fbo1;

            fbo1 = fbo2;
            fbo2 = temp;
        }
    };

}

var blit = function () {

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return function (destination) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

}();

var lastTime = Date.now();

update();

function update() {

    resizeCanvas();

    var dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
    lastTime = Date.now();

    gl.viewport(0, 0, textureWidth, textureHeight);

    if (splatStack.length > 0) {
        for (var m = 0; m < splatStack.pop(); m++) {

            var color = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
            var x = glCanvas.width * Math.random();
            var y = glCanvas.height * Math.random();
            var dx = 1000 * (Math.random() - 0.5);
            var dy = 1000 * (Math.random() - 0.5);

            splat(x, y, dx, dy, color);
        }
    }

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.first[2]);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocity.first[2]);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.second[1]);
    velocity.swap();

    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.first[2]);
    gl.uniform1i(advectionProgram.uniforms.uSource, density.first[2]);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(density.second[1]);
    density.swap();

    for (var i = 0, len = pointers.length; i < len; i++) {
        var pointer = pointers[i];

        if (pointer.moved) {
            splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
            pointer.moved = false;
        }
    }

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.first[2]);
    blit(curl[1]);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.first[2]);
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2]);
    gl.uniform1f(vorticityProgram.uniforms.curl, rocket.smokeCurl);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.second[1]);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.first[2]);
    blit(divergence[1]);

    clearProgram.bind();

    var pressureTexId = pressure.first[2];

    gl.activeTexture(gl.TEXTURE0 + pressureTexId);
    gl.bindTexture(gl.TEXTURE_2D, pressure.first[0]);
    gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId);
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
    blit(pressure.second[1]);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2]);
    pressureTexId = pressure.first[2];
    gl.activeTexture(gl.TEXTURE0 + pressureTexId);

    for (var _i = 0; _i < config.PRESSURE_ITERATIONS; _i++) {
        gl.bindTexture(gl.TEXTURE_2D, pressure.first[0]);
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId);
        blit(pressure.second[1]);
        pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.first[2]);
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.first[2]);
    blit(velocity.second[1]);
    velocity.swap();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    displayProgram.bind();
    gl.uniform1i(displayProgram.uniforms.uTexture, density.first[2]);
    blit(null);

    // Clear the whole canvas.
    ctx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);

    // Draw.
    bullets.forEach(bullet => {
        bullet.draw(ctx);
    })
    rocket.draw(ctx);
    world.draw(ctx);
    // inputState.draw(ctx);

    // Remove old bullets.
    const now = new Date();
    bullets = bullets.filter(bullet => !bullet.isOffScreen() && !bullet.expired(now));

    // Update moving objects.
    rocket.updateState(inputState);
    rocket.emitSmoke(inputState);
    bullets.forEach(bullet => {
        bullet.updateState();
    });

    requestAnimationFrame(update);

}

function splat(x, y, dx, dy, color) {

    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.first[2]);
    gl.uniform1f(splatProgram.uniforms.aspectRatio, glCanvas.width / glCanvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x / glCanvas.width, 1.0 - y / glCanvas.height);
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
    gl.uniform1f(splatProgram.uniforms.radius, rocket.smokeSplatRadius);
    blit(velocity.second[1]);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, density.first[2]);
    gl.uniform3f(splatProgram.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3);
    blit(density.second[1]);
    density.swap();

}

// Handle canvas resizing.
function resizeCanvas() {

    (glCanvas.width !== glCanvas.clientWidth || glCanvas.height !== glCanvas.clientHeight) && (glCanvas.width = glCanvas.clientWidth, glCanvas.height = glCanvas.clientHeight, initFramebuffers());
    (frontCanvas.width !== frontCanvas.clientWidth || frontCanvas.height !== frontCanvas.clientHeight)
    && (frontCanvas.width = frontCanvas.clientWidth, frontCanvas.height = frontCanvas.clientHeight);
}


// glCanvas.addEventListener( 'mousemove', function ( e ) {

//     count++;

//     ( count > 25 ) && (colorArr = [ Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2 ], count = 0);

//     pointers[ 0 ].down  = true;
//     pointers[ 0 ].color = colorArr;
//     pointers[ 0 ].moved = pointers[ 0 ].down;
//     pointers[ 0 ].dx    = (e.offsetX - pointers[ 0 ].x) * 10.0;
//     pointers[ 0 ].dy    = (e.offsetY - pointers[ 0 ].y) * 10.0;
//     pointers[ 0 ].x     = e.offsetX;
//     pointers[ 0 ].y     = e.offsetY;

// } );

// glCanvas.addEventListener( 'touchmove', function ( e ) {

//     e.preventDefault();

//     var touches = e.targetTouches;

//     count++;

//     ( count > 25 ) && (colorArr = [ Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2 ], count = 0);

//     for ( var i = 0, len = touches.length; i < len; i++ ) {

//         if ( i >= pointers.length ) pointers.push( new pointerPrototype() );

//         pointers[ i ].id    = touches[ i ].identifier;
//         pointers[ i ].down  = true;
//         pointers[ i ].x     = touches[ i ].pageX;
//         pointers[ i ].y     = touches[ i ].pageY;
//         pointers[ i ].color = colorArr;

//         var pointer = pointers[ i ];

//         pointer.moved = pointer.down;
//         pointer.dx    = (touches[ i ].pageX - pointer.x) * 10.0;
//         pointer.dy    = (touches[ i ].pageY - pointer.y) * 10.0;
//         pointer.x     = touches[ i ].pageX;
//         pointer.y     = touches[ i ].pageY;

//     }

// }, false );


// Set keyboard listeners.
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
