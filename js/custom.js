//html 태그
const game = document.querySelector(".game");
const canvas = document.querySelector("canvas");
const startBtn = document.querySelector(".start-btn");
const restartBtn = document.querySelector(".restart-btn");
const continueBtn = document.querySelector(".continue-btn");
const endBtn = document.querySelector(".end-btn");
const gameStopMode = document.querySelector(".game-stop");
const gameClear = document.querySelector(".game-clear");
const cntText = document.querySelector(".cnt");

const ctx = canvas.getContext('2d');

canvas.width = Number(window.getComputedStyle(game).width.replace("px", ""));
canvas.height = Number(window.getComputedStyle(game).height.replace("px", ""));

let canvasWidth = canvas.width;
let canvasHeight = canvas.height;

let initPosX = canvasWidth / 2;
let initPosY = canvasHeight * 0.8;

const init = () => {
    canvas.width = Number(window.getComputedStyle(game).width.replace("px", ""));
    canvas.height = Number(window.getComputedStyle(game).height.replace("px", ""));
    console.log(Number(window.getComputedStyle(game).width.replace("px", "")));
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    initPosX = canvasWidth / 2;
    initPosY = canvasHeight * 0.8;
}

const mainColor = "#f0f0f0";
const subColor = "#0095dd";


let requestId = null;
let gameStopped = false;

//ball
//initPos
let x = initPosX;
let y = initPosY;
const ballSize = 6;
const speed = 4;
let degree = {
    x: 1,
    y: 1,
}

//paddle
const paddle = {
    width: 200,
    height: 20,
    x: (canvasWidth / 2) - (200 / 2),
    y: canvasHeight * 0.85,
}

//Brick
const brickColumnCnt = 4;
const brickRowCnt = 8;

let brickCnt = brickColumnCnt * brickRowCnt;

cntText.innerHTML = brickCnt;

let brickList = [];

let brickInfo = {
    width: 70,
    height: 20,
    padding: 10,
    visible: true,
    offsetX: 50,
    offsetY: 50,
}


//direction
const directionMod = {
    leftTop: { x: () => -degree.x, y: () => -degree.y },
    rightTop: { x: () => degree.x, y: () => -degree.y },
    leftBottom: { x: () => -degree.x, y: () => degree.y },
    rightBottom: { x: () => degree.x, y: () => degree.y },
    testMode: { x: () => 0, y: () => -1 },
}

let curDirection = "leftTop";


//break

const breakTypes = {
    topWall: "TOPWALL",
    rightWall: "RIGHTWALL",
    bottomWall: "BOTTOMWALL",
    leftWall: "LEFTWALL",
    brick: "BRICK",
    brickSide: "BRICKSIDE",
    paddleLeft: "PADDLE_LEFT",
    paddleRight: "PADDLE_RIGHT",
}

let breakType = null;


const initBrickSet = () => {



    brickInfo.offsetX = (canvasWidth - (brickRowCnt * (brickInfo.width + brickInfo.padding) - brickInfo.padding)) / 2;

    for (let i = 0; i < brickColumnCnt; i++) {
        brickList[i] = [];
        for (let j = 0; j < brickRowCnt; j++) {
            let x = j * (brickInfo.width + brickInfo.padding) + brickInfo.offsetX;
            let y = i * (brickInfo.height + brickInfo.padding) + brickInfo.offsetY;
            const brick = { ...brickInfo, visible: true, x, y };
            brickList[i].push(brick);
        }
    }
}

const drawBrick = () => {
    for (let i = 0; i < brickList.length; i++) {
        for (let j = 0; j < brickList[i].length; j++) {
            const brick = brickList[i][j];
            ctx.beginPath();
            ctx.rect(brick.x, brick.y, brick.width, brick.height);
            ctx.fillStyle = brick.visible ? subColor : mainColor;
            ctx.fill();
            ctx.closePath();
        }
    }

}

const drawPaddle = () => {
    if (paddle.x <= 0) {
        paddle.x = 0;
    } else if (paddle.x >= canvasWidth - paddle.width) {
        paddle.x = canvasWidth - paddle.width;
    }
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#333";
    ctx.fill();
    ctx.closePath();
}

const checkPaddle = (x, y) => {

    if (y + ballSize >= paddle.y &&
        y + ballSize <= paddle.y + paddle.height) {
        if (x - ballSize >= paddle.x && x + ballSize <= paddle.x + (paddle.width * 0.1)) {
            breakType = "PADDLE_LEFT"
            degree.y = 0.2;
            changeMode();
        } else if (x - ballSize >= paddle.x && x + ballSize <= paddle.x + (paddle.width * 0.2)) {
            breakType = "PADDLE_LEFT"
            degree.y = 0.5;
            changeMode();
        } else if (x - ballSize >= paddle.x && x + ballSize <= paddle.x + (paddle.width * 0.5)) {
            breakType = "PADDLE_LEFT"
            degree.y = 1;
            changeMode();
        } else if (x - ballSize >= paddle.x && x + ballSize <= paddle.x + (paddle.width * 0.8)) {
            breakType = "PADDLE_RIGHT"
            degree.y = 1;
            changeMode();
        } else if (x - ballSize >= paddle.x && x + ballSize <= paddle.x + (paddle.width * 0.9)) {
            breakType = "PADDLE_RIGHT"
            degree.y = 0.5;
            changeMode();
        } else if (x - ballSize >= paddle.x && x + ballSize <= paddle.x + paddle.width) {
            breakType = "PADDLE_RIGHT"
            degree.y = 0.2;
            changeMode();
        }

    }
}

const checkWall = (x, y) => {
    if (x <= 0 + ballSize || x >= canvasWidth - ballSize) {
        breakType = x <= 0 + ballSize ? "LEFTWALL" : "RIGHTWALL";
        changeMode();
    } else if (y <= 0 + ballSize) {
        breakType = "TOPWALL";
        changeMode();
    } else if (y >= 600 - ballSize) {
        stopGame();
    }
}

const checkBrick = (x, y) => {

    if (y > 300) {
        return;
    }

    for (let i = 0; i < brickList.length; i++) {
        for (let j = 0; j < brickList[i].length; j++) {
            const brick = brickList[i][j];
            let bumped = false;
            let isSide = false;
            if (!brick.visible) {
                continue;
            }

            if (x >= brick.x && x <= brick.x + brick.width) {
                if (y - ballSize <= brick.y + brick.height &&
                    y - ballSize >= brick.y) {
                    if (x - ballSize <= brick.x || x + ballSize >= brick.x + brick.width) {
                        bumped = true;
                        isSide = true;
                    }
                    else {
                        bumped = true;
                    }
                } else if (y + ballSize >= brick.y &&
                    y + ballSize <= brick.y + brick.height) {
                    bumped = true;
                }
            }
            if (bumped) {
                if (isSide) {
                    breakType = "BRICKSIDE";
                } else {
                    breakType = "BRICK";
                }
                brickCnt--;
                brick.visible = false;
                changeMode();
                cntText.innerHTML = brickCnt;
                if (brickCnt === 0) {
                    clearGame();
                }
                return;
            }
        }
    }
}

const changeMode = () => {

    switch (breakType) {
        case breakTypes.topWall:
            if (curDirection === "leftTop") {
                curDirection = "leftBottom";
            } else if (curDirection === "rightTop") {
                curDirection = "rightBottom";
            }
            break;
        case breakTypes.rightWall:
            if (curDirection === "rightBottom") {
                curDirection = "leftBottom";
            } else if (curDirection === "rightTop") {
                curDirection = "leftTop";
            }
            break;
        case breakTypes.bottomWall:
            if (curDirection === "leftBottom") {
                curDirection = "leftTop";
            } else if (curDirection === "rightBottom") {
                curDirection = "rightTop";
            }
            break;
        case breakTypes.leftWall:
            if (curDirection === "leftTop") {
                curDirection = "rightTop";
            } else if (curDirection === "leftBottom") {
                curDirection = "rightBottom";
            }
            break;
        case breakTypes.brick:
            if (curDirection === "leftTop") {
                curDirection = "leftBottom";
            } else if (curDirection === "rightTop") {
                curDirection = "rightBottom";
            } else if (curDirection === "leftBottom") {
                curDirection = "leftTop";
            } else if (curDirection === "rightBottom") {
                curDirection = "rightTop";
            }
            break;
        case breakTypes.brickSide:
            if (curDirection === "leftTop") {
                curDirection = "rightTop";
            } else if (curDirection === "leftBottom") {
                curDirection = "rightBottom";
            } else if (curDirection === "rightBottom") {
                curDirection = "leftBottom";
            } else if (curDirection === "rightTop") {
                curDirection = "leftTop";
            }
            break;
        case breakTypes.paddleLeft:
            curDirection = "leftTop";
            break;
        case breakTypes.paddleRight:
            curDirection = "rightTop";
            break;
        default:
            break;
    }
}

const drawBall = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, ballSize, 0, Math.PI * 2);
    ctx.fillStyle = '#0095dd';
    ctx.fill();
    ctx.closePath();
}


const update = () => {

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    checkWall(x, y);
    checkBrick(x, y);
    checkPaddle(x, y);

    drawBrick();
    drawPaddle();

    const moveX = x + (directionMod[curDirection].x() * speed);
    const moveY = y + (directionMod[curDirection].y() * speed);

    drawBall(moveX, moveY);

    x = moveX;
    y = moveY;

    requestId = window.requestAnimationFrame(update);

    if (gameStopped) {
        window.cancelAnimationFrame(requestId);
        return;
    }

}

const drawGame = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawBrick();
    drawPaddle();
    drawBall(initPosX, initPosY);

}

const reset = () => {
    initBrickSet();
    brickCnt = brickColumnCnt * brickRowCnt;
    paddle.x = (canvasWidth / 2) - (200 / 2);
    x = initPosX;
    y = initPosY;
    degree.y = 1;
    breakType = null;
    curDirection = "leftTop";
    gameStopped = false;
    cntText.innerHTML = brickCnt;
}

const startGame = () => {
    startBtn.style.display = "none";
    update();
}

const restartGame = () => {
    reset();
    update();
    gameStopMode.style.display = "none";
}

const continueGame = () => {
    x = initPosX;
    y = initPosY;
    gameStopped = false;
    gameStopMode.style.display = "none";
    curDirection = "leftTop";
    update();
}

const stopGame = () => {
    gameStopped = true;
    gameStopMode.style.display = "flex";
}

const clearGame = () => {
    gameStopped = true;
    gameStopMode.style.display = "none";
    gameClear.style.display = "block";
    endBtn.style.display = "block";
}

const resetGame = () => {
    reset();
    drawGame();
    startBtn.style.display = "block";
    gameClear.style.display = "none";
    endBtn.style.display = "none";
}

const main = () => {
    canvas.addEventListener("mousemove", (e) => {
        paddle.x = e.offsetX;
    });
    init();
    reset();
    drawGame();
    startBtn.addEventListener("click", () => startGame());
    restartBtn.addEventListener("click", () => restartGame());
    continueBtn.addEventListener("click", () => continueGame());
    endBtn.addEventListener("click", () => resetGame());
}

main();
