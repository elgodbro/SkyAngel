const PLANE = $('#plane');
const PLAYING_FIELD = $('.playing-field');
let timerHandler, fuelLevel = 10, isGameOvered = false, isGameStopped = false, lastResults = {"score": -1, "time": -1};
let planeX = 0, planeY = 0, planeSpeed = 5;
let isMovingUp = false, isMovingDown = false, isMovingLeft = false, isMovingRight = false;

$(document).ready(function () {
    $('.start-panel').css('display', 'flex');
    $('.game').css('display', 'none');

    // Обработчики нажатий клавиш
    $(document).on('keydown', function (e) {
        switch (e.keyCode) {
            case 38: // Стрелка вверх
            case 87: // Кнопка W
                isMovingUp = true;
                break;
            case 40: // Стрелка вниз
            case 83: // Кнопка S
                isMovingDown = true;
                break;
            case 37: // Стрелка влево
            case 65: // Кнопка A
                isMovingLeft = true;
                break;
            case 39: // Стрелка вправо
            case 68: // Кнопка D
                isMovingRight = true;
                break;
            case 32: // Пробел
                PauseGame();
                break;
        }
    });

    $(document).on('keyup', function (e) {
        switch (e.keyCode) {
            case 38: // Стрелка вверх
            case 87: // Кнопка W
                isMovingUp = false;
                break;
            case 40: // Стрелка вниз
            case 83: // Кнопка S
                isMovingDown = false;
                break;
            case 37: // Стрелка влево
            case 65: // Кнопка A
                isMovingLeft = false;
                break;
            case 39: // Стрелка вправо
            case 68: // Кнопка D
                isMovingRight = false;
                break;
        }
    });
});

// Начало игры
function StartGame() {
    $('.start-panel').css('display', 'none');
    $('.game').css('display', 'flex');
    $('.content').css('border', 'none');

    $('#fuel-level-bar>div').width('10%');

    planeX = PLAYING_FIELD.offset().left + 10;
    planeY = ((PLAYING_FIELD.offset().top + PLAYING_FIELD.height()) / 2) - (PLANE.height() / 2);
    PLANE.css({ left: planeX, top: planeY });

    StartTimer();
}

// Обновление состояния игры каждый кадр
function UpdateGameTick() {
    if (isGameOvered) return;

    // Движение самолета
    if (isMovingUp) planeY -= planeSpeed;
    if (isMovingDown) planeY += planeSpeed;
    if (isMovingLeft) planeX -= planeSpeed;
    if (isMovingRight) planeX += planeSpeed;

    // Ограничение самолета в пределах игрового поля
    const playingFieldOffesetLeft = PLAYING_FIELD.offset().left;
    const playingFieldOffesetTop = PLAYING_FIELD.offset().top;

    planeX = Math.max(playingFieldOffesetLeft, Math.min(planeX, playingFieldOffesetLeft + PLAYING_FIELD.width() - PLANE.width()));
    planeY = Math.max(playingFieldOffesetTop, Math.min(planeY, playingFieldOffesetTop + PLAYING_FIELD.height() - PLANE.height()));

    // Обновление позиции самолета на экране
    PLANE.css({ left: planeX, top: planeY });

    // Создание объектов (парашюты, звезды, птицы) с определенной вероятностью
    if (Math.random() < 0.0025) {
        CreateParachute();
    }

    if (Math.random() < 0.005) {
        CreateStar();
    }

    if (Math.random() < 0.005) {
        CreateBird();
    }
}

// Перезапуск игры
function RestartGame() {
    $('.game-stats').css('display', 'none');

    // Сброс позиции самолета
    planeX = PLAYING_FIELD.offset().left + 10;
    planeY = ((PLAYING_FIELD.offset().top + PLAYING_FIELD.height()) / 2) - (PLANE.height() / 2);
    PLANE.css({ left: planeX, top: planeY });

    // Удаление всех объектов с поля
    $('.cloud, .parachute, .bird, .star').remove();

    // Сброс счетчиков
    $('#header-stars').text(0);
    ResetFuel();
    ResetTimer();
    PauseGame();
    isGameOvered = false;
}

// Пауза игры
function PauseGame() {
    isGameStopped = !isGameStopped;
    if (isGameStopped) {
        $('#pause-play-btn').attr('src', 'imgs/icons/play.png');
        // Остановка анимации всех объектов
        $('.cloud, .parachute, .star, .bird').stop();
    } else {
        $('#pause-play-btn').attr('src', 'imgs/icons/pause.png');
        // Возобновление анимации облаков и парашютов
        $('.cloud').each(function () {
            const cloud = $(this);
            cloud.animate({ left: -cloud.width() }, 10000 - cloud.position().left, 'linear', function () {
                $(this).remove();
            });
        });
        $('.parachute').each(function () {
            const parachute = $(this);
            parachute.animate({ top: $('.game').offset().top + PLAYING_FIELD.height() }, 4000 - parachute.position().top, 'linear', function () {
                $(this).remove();
            });
        });
        $('.star').each(function () {
            const star = $(this);
            star.animate({ top: $('.game').offset().top + $(PLAYING_FIELD).height() }, 4000 - star.position().top, 'linear', function () {
                $(this).remove();
            });
        });
        // Возобновление анимации птиц
        $('.bird').each(function () {
            const bird = $(this);
            bird.animate({ left: PLAYING_FIELD.offset().left }, 4000 - bird.position().left, 'linear', function () {
                $(this).remove();
            });
            // Покадровая анимация птицы
            let currentFrame = parseInt(bird.css('background-position-x')) / 50;
            const animationInterval = setInterval(function () {
                if (isGameOvered) {
                    clearInterval(animationInterval);
                    return;
                }
                currentFrame = (currentFrame + 1) % 4;
                bird.css('background-position-x', `${currentFrame * 45}px`);
            }, 100);

        });
    }
}

// Конец игры
function EndGame() {
    $('#fuel-level-bar>div').width(0);
    isGameOvered = true;
    StopTimer();
    PauseGame();
    $('#stat-time').text($('#header-timer').text());
    $('#stat-star-count').text($('#header-stars').text());

    if (lastResults.score >= 0 && lastResults.time >= 0) {
        $('.game-stats>p').append(`<hr><p>
            Предыдущая игра:<br/>
            Количество звезд: ${lastResults.score}<br/>
            Время: ${lastResults.time}
          </p><hr>`);
    }
    
    lastResults.score = parseInt($('#header-stars').text());
    lastResults.time = parseInt($('#header-timer').text());

    $('.game-stats').css('display', 'flex');
}

// Обновление текста таймера
function UpdateTimerText(sec) {
    $('#header-timer').text(sec);
}

// Увеличение количества звезд
function AddToStarsCount() {
    $('#header-stars').text(parseInt($('#header-stars').text()) + 1);
}

// Остановка таймера
function StopTimer() {
    clearInterval(timerHandler);
}

// Сброс таймера
function ResetTimer() {
    StopTimer();
    UpdateTimerText(0);
    StartTimer();
}

// Уменьшение уровня топлива
function ReduceFuel() {
    fuelLevel -= 1;
    if (fuelLevel > 0) {
        const newLevel = 114 * fuelLevel / 100;
        $('#fuel-level-bar>div').width(newLevel);
    } else {
        EndGame();
    }
}

// Сброс уровня топлива
function ResetFuel() {
    fuelLevel = 10;
    $('#fuel-level-bar>div').width('10%');
}

// Создание облака
function CreateCloud() {
    const cloudType = Math.floor(Math.random() * 3) + 1;
    const cloud = $('<div class="cloud cloud-' + cloudType + '"></div>');

    const cloudTop = Math.random() * (PLAYING_FIELD.height() + PLAYING_FIELD.offset().top - cloud.height());

    cloud.css({
        left: PLAYING_FIELD.width() + PLAYING_FIELD.offset().left,
        top: cloudTop
    });
    $('.playing-field').append(cloud);

    cloud.animate({ left: PLAYING_FIELD.offset().left - 100 }, 10000, 'linear', function () {
        $(this).remove();
    });
}

// Создание парашюта
function CreateParachute() {
    const parachute = $('<div class="parachute"></div>');
    parachute.css({
        left: Math.random() * (PLAYING_FIELD.width() - 50) + PLAYING_FIELD.offset().left,
        top: PLAYING_FIELD.offset().top,
    });
    $('.playing-field').append(parachute);
    parachute.animate({ top: $('.game').offset().top + $(PLAYING_FIELD).height() }, 4000, 'linear', function () {
        parachute.remove();
    });

    const parachuteCollisionCheckInterval = setInterval(function () {
        if (isGameOvered) return;

        const planeLeft = PLANE.offset().left;
        const planeTop = PLANE.offset().top;
        const planeRight = planeLeft + PLANE.width();
        const planeBottom = planeTop + PLANE.height();

        const parachuteLeft = parachute.offset().left;
        const parachuteTop = parachute.offset().top;
        const parachuteRight = parachuteLeft + parachute.width();
        const parachuteBottom = parachuteTop + parachute.height();

        if (
            planeRight > parachuteLeft &&
            planeLeft < parachuteRight &&
            planeBottom > parachuteTop &&
            planeTop < parachuteBottom
        ) {
            fuelLevel += 10;
            if (fuelLevel > 100) {
                fuelLevel = 100;
            }
            $('#fuel-level-bar>div').width(114 * fuelLevel / 100);
            parachute.remove();
            clearInterval(parachuteCollisionCheckInterval);
        }
    }, 10);
}

// Создание звезды
function CreateStar() {
    const star = $('<div class="star"></div>');
    star.css({
        left: Math.random() * (PLAYING_FIELD.width() - 50) + PLAYING_FIELD.offset().left,
        top: PLAYING_FIELD.offset().top,
    });
    $('.playing-field').append(star);
    star.animate({ top: $('.game').offset().top + $(PLAYING_FIELD).height() }, 4000, 'linear', function () {
        star.remove();
    });

    const starCollisionCheckInterval = setInterval(function () {
        if (isGameOvered) return;

        const planeLeft = PLANE.offset().left;
        const planeTop = PLANE.offset().top;
        const planeRight = planeLeft + PLANE.width();
        const planeBottom = planeTop + PLANE.height();

        const starLeft = star.offset().left;
        const starTop = star.offset().top;
        const starRight = starLeft + star.width();
        const starBottom = starTop + star.height();

        if (
            planeRight > starLeft &&
            planeLeft < starRight &&
            planeBottom > starTop &&
            planeTop < starBottom
        ) {
            AddToStarsCount();
            star.remove();
            clearInterval(starCollisionCheckInterval);
        }
    }, 10);
}

// Создание птицы
function CreateBird() {
    const bird = $('<div class="bird"></div>');
    bird.css({
        left: PLAYING_FIELD.width() + PLAYING_FIELD.offset().left,
        top: Math.random() * (PLAYING_FIELD.height() - bird.height()) + PLAYING_FIELD.offset().top,
        'background-position-x': '0px',
    });
    $('.playing-field').append(bird);

    // Анимация птицы
    let currentFrame = 0;
    const animationInterval = setInterval(function () {
        if (isGameOvered) {
            clearInterval(animationInterval);
            return;
        }
        currentFrame = (currentFrame + 1) % 4;
        bird.css('background-position-x', `${currentFrame * 45}px`);
    }, 100);

    // Движение птицы
    bird.animate({ left: PLAYING_FIELD.offset().left }, 4000, 'linear', function () {
        $(this).remove();
        clearInterval(animationInterval);
    });

    // Проверка столкновения с птицей
    const birdCollisionCheckInterval = setInterval(function () {
        if (isGameOvered) return;

        const planeLeft = PLANE.offset().left;
        const planeTop = PLANE.offset().top;
        const planeRight = planeLeft + PLANE.width();
        const planeBottom = planeTop + PLANE.height();

        const birdLeft = bird.offset().left;
        const birdTop = bird.offset().top;
        const birdRight = birdLeft + bird.width();
        const birdBottom = birdTop + bird.height();

        if (
            planeRight > birdLeft &&
            planeLeft < birdRight &&
            planeBottom > birdTop &&
            planeTop < birdBottom
        ) {
            EndGame();
            clearInterval(birdCollisionCheckInterval);
        }
    }, 10);
}

// Запуск таймера
function StartTimer() {
    let msec = 0, sec = 0;

    timerHandler = setInterval(function () {
        if (!isGameStopped) {
            if (msec >= 60) {
                sec++;
                UpdateTimerText(sec);
                ReduceFuel();
                CreateCloud();
                CreateCloud();
                msec = 0;
            }

            UpdateGameTick();
            msec++;
        }
    }, 1 / 60)
}