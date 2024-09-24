const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
restartButton.style.display = 'none';
let gameRunning = false;
let levelPass = false;

let fontReady = false;

//timer vars
let ballStartTimer = null;
let countdown = 3;
let countdownInterval = null;


//paddle vars
let paddleHeight = 15;
let paddleWidth = 60;
let paddleX = (canvas.width - paddleWidth) /2;  //starting x coord (centered)
let paddleY = (canvas.height - paddleHeight - 100);

//ball vars
let ballRadius = 4;
let x = canvas.width /2;    //starting x coord 
let y = canvas.height - 250; //starting y coord
let maxSpeed = 7;
let dx = 0;      //x vel
let dy = (maxSpeed); //y vel

//keyboard control vars
let rightPressed = false;
let leftPressed = false;

//brick vars
let brickRowCount = 7;
let brickColumnCount = 12;
let brickWidth = 55;
let brickHeight = 15;
let brickPadding = 5;      //space between bricks
let brickOffsetTop = 50;    //top offset for brick grid
let brickOffsetLeft = 40;   //left offset for brick grid

//score and lives
let score = 0;
let lives = 3;
let gameOver = false;

//bricks array
let bricks = [];
//intialize bricks array to have x, y, and status flags for each brick
for(let c = 0; c < brickColumnCount; c++) {         
    bricks[c] = []; //initialize array for each column
    for(let r = 0; r < brickRowCount; r++) {
        //each brick is an obj w/ x, y coords and a status flag
        bricks[c][r] = { x: 0, y: 0, status: 1}; //status 1 means brick visible
    }
}

//event listeners for key presses/releases
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
document.addEventListener('keydown', keyDownHandler, false); //triggered when key is pressed down
document.addEventListener('keyup', keyUpHandler, false);     //triggered when key is released
canvas.addEventListener('mousemove', mouseMoveHandler, false); //mouse movement tracker

document.fonts.load('700 48px "Silkscreen"').then(() => {
    fontReady = true;
});

function keyDownHandler(e) {
    if(e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = true;
    }
    else if (e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = false;
    }
    else if (e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    //get bounding rect of canvas
    let rect = canvas.getBoundingClientRect();

    //calc moust pos within canvas
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    //ensure the paddle stays within canvas boundaries
    if(mouseX - paddleWidth / 2 > 0 && mouseX + paddleWidth / 2 < canvas.width) {
        paddleX = mouseX - paddleWidth / 2;
    } else if(mouseX - paddleWidth/2 <=0) {
        paddleX = 0;
    } else if(mouseX + paddleWidth/2 >= canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
}

function displayCountdown() {
    if(countdownInterval) {
        clearInterval(countdownInterval);
    }
    countdownInterval = setInterval(() => {
        if(countdown > 1) {
            countdown--;
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdown = null; //stop displaying countdown
            dy = -maxSpeed;
            dx = 0;
        }
    }, 1000); //update every second
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2); //draw circle at (x,y) with radius ballRadius
    ctx. fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight); //draw rectangle for paddle
    let gradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + paddleHeight);
    gradient.addColorStop(0, '#4b4b4b');
    gradient.addColorStop(1, '#a3a3a3');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.closePath;
}

//function for rounded edges on bricks
function drawRoundedBrick(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawBricks() {
    ctx.save();

    //set shadow properties
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;


    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            if(bricks[c][r].status == 1) {      //only draw brick if it's supposed to be visible
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft; //calc x location
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop; //calc y location
                bricks[c][r].x = brickX; //pos for collision detection
                bricks[c][r].y = brickY;

                //create a gradient
                let gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                gradient.addColorStop(0, '#0c14c6');
                gradient.addColorStop(1, '#21bcff');

                //draw a rounded rectangle

                drawRoundedBrick(brickX, brickY, brickWidth, brickHeight, 5);

                //fill w/ gradient

                ctx.fillStyle = gradient;
                ctx.fill();

                //add a stroke
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#000000';
                ctx.stroke();

                // ctx.beginPath();
                // ctx.rect(brickX, brickY, brickWidth, brickHeight); //draw brick
                // ctx.fillStyle = '#0095DD';
                // ctx.fill();
                // ctx.closePath;
            }
        }
    }

}

function collisionDetection() {
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r]; //curr brick
            if(b.status == 1) {
                //calc sides of brick
                let brickLeft = b.x;
                let brickRight = b.x + brickWidth;
                let brickTop = b.y;
                let brickBottom = b.y + brickHeight;

                //check if ball pos overlaps with brick pos
                if(x + ballRadius > brickLeft && x - ballRadius < brickRight && y + ballRadius > brickTop && y - ballRadius < brickBottom) {
                    //determine collision side and reverse ball direction
                    if(x < brickLeft || x > brickRight) {
                        dx = -dx
                    } else {
                        dy = -dy; 
                    }
                    b.status = 0; //status 0 means brick broken
                    score++;
                    if(score == brickRowCount * brickColumnCount) { //== brickRowCount * brickColumnCount
                        levelPass = true;
                    }

                }
            }
        }
    }
}

//score counter top left
//later change score to be independent, doesn't reflect blocks hit, going to need a different counter var for blocks hit
function drawScore() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Score: ' + score, 35, 20); 
}

//lives counter top right
function drawLives() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Lives: ' + lives, canvas.width - 35, 20); //lives at top right corner
}

function drawGameOver() {
    if (!fontReady) {
        //if font not ready, wait and try again
        setTimeout(drawGameOver, 100);
        return;
    }

    clearCanvas();

    //set font properties
    ctx.font = 'bold 48px "Silkscreen", sans-serif';
    ctx.fillStyle = '#FF0000'; //red
    ctx.textAlign = 'center';

    //draw 'GAME OVER' text
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);

    //maybe include final score or something else here
}

function drawYouWin() {
    if (!fontReady) {
        setTimeout(drawYouWin, 100);
        return;
    }

    clearCanvas();

    //set font properties
    ctx.font = '48px "Silkscreen", sans-serif';
    ctx.fillStyle = '#20d10a'; //bright green

    //draw 'YOU WIN' text

    ctx.fillText('YOU WIN', canvas.width/2, 250);
}

//clear screen
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    clearCanvas();

    if(!gameRunning) {
        //maybe add a title screen here later

        return;
    }

    //draw game elements
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();

    if (countdown !== null) {
        ctx.font = '48px Arial';
        ctx.fillStyle = '#0095DD';
        ctx.textAlign = 'center';
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
    }

    //handle game logic
    collisionDetection();
    if (levelPass == true) {
        startButton.style.display = 'unset';
        gameRunning = false;
        if(ballStartTimer) {
            clearTimeout(ballStartTimer);
            ballStartTimer = null;
        }
        if(countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        drawYouWin();
        return;
    }
    //update ball pos
    x += dx;
    y += dy;

    //calc paddle edges
    let paddleTop = paddleY;
    let paddleBottom = paddleY + paddleHeight;
    let paddleLeft = paddleX;
    let paddleRight = paddleX + paddleWidth;

    //bounce ball of left and right walls
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    if(y < 0 + ballRadius) {
        dy = -dy
    }

    //check for collision w/ paddle
    if (y + dy < paddleY) {
        dy = dy;
    } else if(y + dy > canvas.height - ballRadius - paddleY) {
    
        if(y + ballRadius >= paddleTop && y + ballRadius <= paddleBottom && x + ballRadius > paddleLeft && x - ballRadius < paddleRight) {
            dy = -Math.abs(dy); //bounce off paddle
            //calc hit pos relative to center of paddle
            let relativeHitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2); 
            
            dx = relativeHitPos * maxSpeed;
            } else if(y > canvas.height + 100){
                //ball missed paddle
                lives--;
                if(!lives) {
                    //game over condition
                    gameOver = true;
                    //add some game over text before restart button pressed
                    gameRunning = false;
                    restartButton.style.display = 'unset';
                    //clear any timers
                    if(ballStartTimer) {
                        clearTimeout(ballStartTimer);
                        ballStartTimer = null;
                    }
                    if(countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    }

                    drawGameOver();

                    return;

                    
                } else{
                    //reset ball and paddle pos
                    x = canvas.width/2; y = canvas.height-250;
                    dx = 0;
                    dy = 0;
                    paddleX = (canvas.width - paddleWidth) / 2;

                    countdown = 3;
                    displayCountdown();

                    //clear any existing timer
                    if(ballStartTimer) {
                        clearTimeout(ballStartTimer);
                    }
                    //ball starts moving 3 seconds after start
                    ballStartTimer = setTimeout(() => { //setTimeout delays function 3000ms
                        dy = maxSpeed;
                        dx = Math.random(); //set start x vel to range between -.5 and .5
                        if(Math.random() > 0.5) 
                            dx = -dx
                        ballStartTimer = null;
                    }, 3000);
                }
            }
    }

    //move paddle based on input
    if(rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7; //move paddle right
    } else if(leftPressed && paddleX > 0) {
        paddleX -= 7; //move paddle left
    }

    if(gameRunning) {
        //request next frame
        requestAnimationFrame(draw);
    } else if(gameOver) {
        //draw game over screen
        drawGameOver();

        requestAnimationFrame(draw);
    } else if(levelPass) {
        //you win screen
        drawYouWin();

        requestAnimationFrame(draw);
    }


}

function resetGame() {
    gameRunning = false;
    levelPass = false;

    score = 0;
    lives = 3;

    x = canvas.width /2;
    y = canvas.height - 250;
    dx = 0;
    dy = 0;

    paddleX = (canvas.width - paddleWidth) / 2;

    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    clearCanvas();
}

function startGame() {
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    resetGame();
    gameRunning = true;
    gameOver = false;
    levelPass = false;
    draw();

    countdown = 3;
    displayCountdown();

    //clear any existing timer
    if(ballStartTimer) {
        clearTimeout(ballStartTimer);
    }
    //ball starts moving 3 seconds after start
    ballStartTimer = setTimeout(() => { 
        dy = maxSpeed;
        dx = Math.random();
        if(Math.random() > 0.5)
            dx = -dx
        ballStartTimer = null;
    }, 3000);
}

function restartGame() {
    clearCanvas();
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    resetGame();
    gameRunning = true;
    gameOver = false;
    levelPass = false;
    draw();

    countdown = 3;
    displayCountdown();

    //clear any existing timer
    if(ballStartTimer) {
        clearTimeout(ballStartTimer);
    }
    //ball starts moving 3 seconds after start
    ballStartTimer = setTimeout(() => { 
        dy = maxSpeed;
        dx = Math.random();
        if(Math.random() > 0.5)
            dx = -dx
        ballStartTimer = null;
    }, 3000);
}