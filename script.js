const Start_button = document.getElementById('start_btn');
const welcome_screen = document.querySelector('.welcome');
const of_the_nxt = document.querySelector('.of_the_nxt');
const details_btn = document.getElementById('game_details');
const restart_btn = document.getElementById('restart');

const music = document.getElementById('bg_song');
const music_btn = document.getElementById('music');
const correct_sound = new Audio('src_sound/Right.mp3');
const wrong_sound = new Audio('src_sound/Wrong.mp3'); 

const score = document.getElementById('scoore'); 
const question_box = document.getElementById('show_question');

const options = [
    document.getElementById('answer_text_1'),
    document.getElementById('answer_text_2'),
    document.getElementById('answer_text_3'),
    document.getElementById('answer_text_4')
];

const option_btns = [
    document.getElementById('btn_1'),
    document.getElementById('btn_2'),
    document.getElementById('btn_3'),
    document.getElementById('btn_4')
];


let current_score = 0;
let current_correct_index = -1; 




function choose_question_file(user_score){
    if (user_score <= 40) {
        return "src_data/level_1.json";
    }
    else if (user_score <= 100) {
        return "src_data/level_2.json";
    } 
    else if (user_score <= 150) {
        return "src_data/level_3.json";
    } 
    else if (user_score <= 200) {
        return "src_data/level_4.json";
    } 
    else if (user_score <= 250) {
        return "src_data/level_5.json";
    } 
    else if (user_score <= 300) {
        return "src_data/level_6.json";
    } 
    else if (user_score <= 350) {
        return "src_data/level_7.json";
    } 
    else if (user_score <= 400) {
        return "src_data/level_8.json";
    } 
    else if (user_score <= 500) {
        return "src_data/level_9.json";
    }
    else {
        return "src_data/level_10.json";
    }
}


function on_any_box_and_get_correct_index(real_answer , fake_1 , fake_2 , fake_3){

    const correct_pos = Math.floor(Math.random() * 4) ; 

    if (correct_pos === 0){
        options[0].textContent = real_answer; 
        options[1].textContent = fake_1;
        options[2].textContent = fake_2;
        options[3].textContent = fake_3;
    }
    else if (correct_pos === 1){
        options[0].textContent = fake_1;
        options[1].textContent = real_answer;
        options[2].textContent = fake_2;
        options[3].textContent = fake_3;
    }
    else if (correct_pos === 2){
        options[0].textContent = fake_1;
        options[1].textContent = fake_2;
        options[2].textContent = real_answer;
        options[3].textContent = fake_3;
    }
    else{ 
        options[0].textContent = fake_1;
        options[1].textContent = fake_2; 
        options[2].textContent = fake_3;
        options[3].textContent = real_answer;
    }
    
    return correct_pos;
}


function guess_in_range(length){

     return Math.floor(Math.random() * 10000) % length;
}


function choose_any_question_answer(dict_data) {
    const keys = Object.keys(dict_data); 
    const length = keys.length;

    const guess_index = guess_in_range(length); 
    
    let fake_guess_1_index, fake_guess_2_index, fake_guess_3_index;
    
    do { fake_guess_1_index = guess_in_range(length); } while (fake_guess_1_index === guess_index);
    do { fake_guess_2_index = guess_in_range(length); } while (fake_guess_2_index === guess_index || fake_guess_2_index === fake_guess_1_index);
    do { fake_guess_3_index = guess_in_range(length); } while (fake_guess_3_index === guess_index || fake_guess_3_index === fake_guess_1_index || fake_guess_3_index === fake_guess_2_index);

    const real_answer = keys[guess_index];  

    const question = dict_data[real_answer]; 
                    
    const fake_answer_1 = keys[fake_guess_1_index];         
    const fake_answer_2 = keys[fake_guess_2_index];         
    const fake_answer_3 = keys[fake_guess_3_index];         

    question_box.textContent = question; 

    return [real_answer, fake_answer_1, fake_answer_2, fake_answer_3];
}

function playSound(isCorrect) {

        if (isCorrect) {
            correct_sound.currentTime = 0; 
            correct_sound.play();
        } else {
            wrong_sound.currentTime = 0;
            wrong_sound.play();
        }

}


async function fetch_data(file_name) {

        let response = await fetch(file_name);   

        let data = await response.json();

        
        return data;
    
}



function show_scoore(isCorrect = null) {

    current_score = score.textContent.split(" : ")[1];
    current_score = parseInt(current_score);
    
    if (isCorrect === true) {
        current_score += 10;
    } else if (isCorrect === false) {
        current_score -= 5;
    }else{
        current_score = 0;
    }

    score.textContent = `Score : ${current_score}`; 
}


function handle_answer_click(selected_index) {
    if (selected_index === current_correct_index) { 
        show_scoore(true);
        playSound(true);
    } else {
        show_scoore(false);
        playSound(false);
    }
    
    setTimeout(load_next_question, 300); 
}

async function load_next_question() {
    const file_name = choose_question_file(current_score);

    const data_object = await fetch_data(file_name);


    const [real_answer, fake_1, fake_2, fake_3] = choose_any_question_answer(data_object);

    current_correct_index = on_any_box_and_get_correct_index(real_answer, fake_1, fake_2, fake_3);
}


function main() {
    
    show_scoore(null); 
    
    
    Start_button.addEventListener('click', function() {
        welcome_screen.style.display = "none";
        of_the_nxt.style.display = "flex"; 
        music.muted = false;
        music.play();
        load_next_question(); 
    });

    
    restart_btn.addEventListener('click', function() {
        current_score = 0;
        show_scoore(null); 
        load_next_question();
    });
    
    details_btn.addEventListener('click', function() {
        location.reload(); 
    });



    music_btn.addEventListener('click', function() {
        if (music.paused) {
            music.play()
            music_btn.innerHTML = "Music: OFF"; 
        } else {
            music.pause(); 
            music_btn.innerHTML = "Music: ON";
        }
    });


    for (let i = 0; i < option_btns.length; i++) {
        option_btns[i].addEventListener('click', function() {
            handle_answer_click(i); 
        });
    }
}


main();




