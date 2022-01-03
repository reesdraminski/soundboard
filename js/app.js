// references to DOM elements
const recordBtn = document.getElementById("record");
const boardEl = document.getElementById("board");

const hasLocalStorage = checkForLocalStorage();

// variables to track program state
let recording = false;
let mediaRecorder;
let sounds = [];

/**
 * Intialize UI components.
 */
(function initUI() {
    // load in all sounds from localStorage
    if (hasLocalStorage) 
    {
        // get sounds from localStorage
        sounds = JSON.parse(localStorage.getItem("sounds")) || [];

        // convert the base64 that was saved to a blob
        sounds.map(sound => createSoundboardButton(sound.name, base64toBlob(sound.data)));
    }

    /**
     * Bind start and stop recording actions to the record button.
     */
    recordBtn.onclick = () => {
        // if the user cannot record, stop trying
        if (!navigator.mediaDevices) return;

        // if the user is already recording
        if (recording)
        {
            // if there is a mediarecorder already created, stop it
            if (mediaRecorder)
            {
                // track that we've stopped recording
                recording = false;

                // update the button to prompt user to record a new sound
                recordBtn.textContent = "Record New Sound";

                // stop recording
                mediaRecorder.stop();

                // take away the red background that was the recording indicator
                recordBtn.style.background = "";
            }
        }
        // if the user is not yet recording
        else
        {
            // track that we're now recording
            recording = true;

            // update the button to prompt user to stop recording
            recordBtn.textContent = "Stop Recording";

            // array to store the audio chunks as they're created
            const chunks = [];

            // start recording
            // from: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // create mediarecorder from the audio stream and start recording
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();

                    // show the user that we're recording'
                    recordBtn.style.background = "red";
        
                    // store chunks as the mediarecorder creates them
                    mediaRecorder.ondataavailable = e => chunks.push(e.data);

                    // when the user stops recording, process data
                    mediaRecorder.onstop = () => {
                        // close audio stream
                        stream.getTracks().forEach(track => track.stop());

                        // prompt the user for the name of the sound
                        const name = prompt("What would you like to name this sound?") || "";

                        // create blob from audio chunks
                        const blob = new Blob(chunks);

                        // create soundboard button from newly recorded sound
                        createSoundboardButton(name, blob);

                        // convert blob to base64 string
                        const reader = new FileReader();
                        reader.readAsDataURL(blob); 
                        reader.onloadend = () => {
                            // get base64 encoding
                            let base64data = reader.result;

                            // get rid of content type and base64 indicators
                            const start = "base64,";
                            base64data = base64data.slice(base64data.indexOf(start) + start.length);

                            // add sound to sounds list
                            sounds.push({
                                name: name,
                                data: base64data
                            });

                            // save data to localStorage
                            if (hasLocalStorage)
                            {
                                localStorage.setItem("sounds", JSON.stringify(sounds));
                            }
                        }
                    }
                });
        }
    }
})();

/**
 * Create a soundboard button card that plays the sound when clicked.
 * @param {String} name the name of the sound
 * @param {Blob} soundBlob the sound that will be played
 */
function createSoundboardButton(name, soundBlob) {
    // add soundboard button to play the audio
    const card = createElement(boardEl, "div", {
        class: "card",
        onclick: () => {
            // create audio element from blob data URL
            const audio = new Audio(URL.createObjectURL(soundBlob));

            // play the sound
            audio.play();
        }
    });

    // create child text element for sound name
    createElement(card, "span", { textContent: name });
}

/**
 * https://stackoverflow.com/a/20151856
 * @param {String} base64Data 
 * @returns {Blob} blob
 */
function base64toBlob(base64Data) {
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        let begin = sliceIndex * sliceSize;
        let end = Math.min(begin + sliceSize, bytesLength);

        let bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }

        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }

    return new Blob(byteArrays);
}

/**
 * Create an HTML element and add it to the DOM tree.
 * @param {HTMLElement} parent 
 * @param {String} tag 
 * @param {Object} attributes 
 */
function createElement(parent, tag, attributes={}) {
    // create the element to whatever tag was given
    const el = document.createElement(tag);
    
    // go through all the attributes in the object that was given
    Object.entries(attributes)
        .forEach(([attr, value]) => {
            // handle the various special cases that will cause the Element to be malformed
            if (attr == "innerText") 
            {
                el.innerText = value;
            }
            else if (attr == "innerHTML") 
            {
                el.innerHTML = value;
            }
            else if (attr == "textContent") 
            {
                el.textContent = value;
            }
            else if (attr == "onclick")
            {
                el.onclick = value;
            }
            else if (attr == "onkeydown")
            {
                el.onkeydown = value;
            }
            else
            {
                el.setAttribute(attr, value);
            }
        });
    
    // add the newly created element to its parent
    parent.appendChild(el);

    // return the element in case this element is a parent for later element creation
    return el;
}

/**
 * Check if localStorage exist and is available.
 * https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available/16427747
 * @return {Boolean} localStorageExists
 */
function checkForLocalStorage(){
    const test = "test";

    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);

        return true;
    } catch(e) {
        return false;
    }
}