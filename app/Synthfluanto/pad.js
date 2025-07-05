// Author: Genesis Barrios
// Start Date: 09-2020

var octave = 4;
var synthOption = 'Synth';
var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];


//this will be in the settings table. 
//whenever the user saves a session or song 
//this data will be saved together in another table
var gain = 5;
var reverb = 1000;
var eq = 20000;
var decay = 1;

var root = 0; //let user choose
//var familyOfTriads = [[0,4,7],[0,3,7],[0,3,6],[0,4,8]];

//Tone.js objects

//FM Synth
var FMSynth = new Tone.PolySynth(3, Tone.FMSynth, {
    oscillator : {
        volume:gain,
      type : "sine"
    }
  });

//FM Synth
var AMSynth = new Tone.PolySynth(3, Tone.AMSynth, {
    oscillator : {
        volume:gain,
      type : "sine"
    }
  });

//Mono Synth
var MonoSynth = new Tone.PolySynth(3, Tone.MonoSynth, {
    oscillator : {
        volume:gain,
      type : "sine"
    }
  });

//Default PolySynth
var synth = new Tone.PolySynth(3, Tone.Synth, {
    oscillator : {
        volume:gain,
      type : "sine"
    }
  });

//-------FILTERS----------
//EQ
const filter = new Tone.Filter();
filter.set({
    frequency: eq,
    type: "lowpass"
});

//Reverb
var freeverb = new Tone.Freeverb();
freeverb.dampening.value = reverb;


//-------OUTPUT CHAIN-----------
// synth->filter->reverb->master
synth.connect(filter);  
filter.connect(freeverb);
//freeverb.connect(Tone.Master);
freeverb.toMaster();

FMSynth.connect(filter);  
filter.connect(freeverb);
//freeverb.connect(Tone.Master);
freeverb.toMaster();

AMSynth.connect(filter);  
filter.connect(freeverb);
//freeverb.connect(Tone.Master);
freeverb.toMaster();

MonoSynth.connect(filter);  
filter.connect(freeverb);
//freeverb.connect(Tone.Master);
freeverb.toMaster();

//setters
function setGain(num){
    gain = Math.round(num / 10);
    Tone.Master.volume.value = gain;
}

function setReverb(num){
    reverb = Math.round(num) * 100 / 2;
    freeverb.dampening.value = reverb;
}

function setEQ(num){
    eq = Math.round(num * 100); //+ 5000;
    
    filter.set({
        frequency: eq,
        type: "lowpass"
    });
}

function setDecay(num){
    decay = Math.round(num / 10);
}

var keyToNumber = {
    "w": 1,
    "e": 2,
    "r": 3,
    "t": 4,
    "s": 5,
    "d": 6,
    "f": 7,
    "g": 8,
    "x": 9,
    "c": 10,
    "v": 11,
    "b": 12
  };

//-----------INPUT LISTENERS---------------

//Key Press Listener
document.addEventListener('keypress', getKey);

//power button event listener
var onoff = document.getElementById("myonoffswitch");

//keyInput event listener
var keyInput = document.getElementById("keyInput");

//octaveInput event listener
var octaveInput = document.getElementById("octaveInput");

//synthInput event listener
var synthInput = document.getElementById("synthInput");

//knobs event listeners
var knob1 = document.getElementById("knob1").children[0];//Decay
var knob2 = document.getElementById("knob2").children[0];//EQ
var knob3 = document.getElementById("knob3").children[0];//Reverb
var knob4 = document.getElementById("knob4").children[0];//Gain


//---------EVENT LISTENERS-------------
onoff.addEventListener('change', async() => {
    if(onoff.checked == true){
        setEQ(20000);
        setReverb(reverb);
        setGain(5);
        await Tone.start();
        console.log('Tone.js started');
    }else{
        //Tone.stop();
        //console.log('Tone.js stopped');
    }
});

keyInput.addEventListener('change', function() {
   root = keyInput.value;
   console.log('root set to: ' + notes[root]);
});

octaveInput.addEventListener('change', function(){
    octave = octaveInput.value;
    console.log('octave set to: ' + octave);
});

synthInput.addEventListener('change', function(){
    synthOption = synthInput.value;
    console.log('synth option: ' + synthOption);
});

knob1.addEventListener('change', function() {
    setDecay(knob1.value)
    console.log('decay set to ' + decay);
});

knob2.addEventListener('change', function() {
    setEQ(knob2.value)
    console.log('eq set to ' + eq);
});

knob3.addEventListener('change', function() {
    setReverb(knob3.value)
    console.log('reverb set to ' + reverb);
});

knob4.addEventListener('change', function() {
    setGain(knob4.value)
    console.log('gain set to ' + gain);
});

//Pad Press Listeners
var pads = document.querySelectorAll(".pad");
for (const pad of pads) {
    pad.addEventListener('click', function(event) {
        event.target.classList.add('glow');
        setTimeout(function() { event.target.classList.remove('glow'); }, 500);
        playSound(pad.id.replace("pad", ""));
    });
}

//Get Key Pressed
function getKey(e) {
  key = e.code;
  keyPressed(e.code);
}

//Convert Key to Num and playSound()
function keyPressed(code){
    var padNum = keyToNumber[code.replace("Key", "").toLowerCase()];
    var pad = document.getElementById('pad'+padNum);
    pad.classList.add('glow');
    setTimeout(function() { pad.classList.remove('glow'); }, 500);
    playSound(padNum);
}

function getNoteFromNum(num, key){

    return notes[key + num % 12 - 1];//key is our starting note. 
                                    //num is the number of the note(pad) 
                                    //in the scale that wants to be played.
                                    //minus 1 because the pads start at 1.
}

function getChordFromNum_MajorScale(num, key, octave){
    //todo: fix last note should be in next octave?

    var padNumToNotesIndex = {//pad number corresponds to notes in scale which are indexed from notes array.
        1: 0,
        2: 2,
        3: 4,
        4: 5,
        5: 7,
        6: 9,
        7: 11,
        8: 0
    };

    var notesIndex = padNumToNotesIndex[num];
    key = 1 * key;
    notesIndex = 1 * notesIndex;

    var note = notes[(key + notesIndex) % 12];
    
    if(num == 1 || num == 4 || num == 5 || num == 8){//major chords
        var chord = [note + octave, notes[(key + notesIndex + 4) % 12] + octave, notes[(key + notesIndex + 7) % 12] + octave];
        return chord;
    }

    if(num == 2 || num == 3){//minor chords
        return [note + octave, notes[(key + notesIndex + 3) % 12] + octave, notes[(key + notesIndex + 7) % 12] + octave];
    }

    if(num == 7){//diminished
        return [note + octave, notes[(key + notesIndex + 3) % 12] + octave, notes[(key + notesIndex + 6) % 12] + octave];
    }
}

function getNoteFromNum_MajorScale(num, key, octave){
    //todo: fix last note should be in next octave?

    var padNumToNotesIndex = {//pad number corresponds to notes in scale which are indexed from notes array.
        1: 0,
        2: 2,
        3: 4,
        4: 5,
        5: 7,
        6: 9,
        7: 11,
        8: 0
    };

    var notesIndex = padNumToNotesIndex[num];
    var note = notes[(key + notesIndex) % 12];
    return (note + octave);
}

function playSound(num){
    var chord = getChordFromNum_MajorScale(num, root, octave);
    var note = getNoteFromNum_MajorScale(num, root, octave);

    if(synthOption == 'Synth'){
        console.log(chord);
        synth.triggerAttackRelease(chord, decay + 'n');
    }else if(synthOption == 'FM Synth'){
        console.log(chord);
        FMSynth.triggerAttackRelease(chord, decay + 'n');
    }else if(synthOption == 'AM Synth'){
        console.log(chord);
        AMSynth.triggerAttackRelease(chord, decay + 'n');
    }else if(synthOption == 'Mono Synth'){
        console.log(note);
        MonoSynth.triggerAttackRelease(note, decay + 'n');
    }
    
}

