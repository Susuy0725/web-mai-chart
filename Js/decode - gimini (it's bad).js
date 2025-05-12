import * as render from "./render.js"; // Assuming render.js is in the same directory

export function simai_decode(_data) {
    _data = _data.replace(/(\r\n|\n|\r| )/gm, "");
    let tempNote = [];
    const dataTemp = _data.split(",");
    let timeSum = 0;
    let slice = 1;
    let bpm = 60;

    for (let i = 0; i < dataTemp.length; i++) {
        let dataSegment = dataTemp[i]; // Use different variable name
        if (dataSegment) {
            // BPM parsing
            while (dataSegment.includes("(") && dataSegment.includes(")")) {
                const openParen = dataSegment.indexOf("(");
                const closeParen = dataSegment.indexOf(")");
                if (closeParen > openParen) {
                    bpm = parseFloat(dataSegment.slice(openParen + 1, closeParen));
                    if (isNaN(bpm)) bpm = 60; // Default if parse fails
                    dataSegment = dataSegment.substring(0, openParen) + dataSegment.substring(closeParen + 1);
                } else break; // Malformed
            }

            // Slice parsing
            while (dataSegment.includes("{") && dataSegment.includes("}")) {
                const openBrace = dataSegment.lastIndexOf("{"); // Usually last one matters for overrides
                const closeBrace = dataSegment.indexOf("}", openBrace); // Find corresponding
                if (closeBrace > openBrace) {
                    slice = parseFloat(dataSegment.slice(openBrace + 1, closeBrace));
                    if (isNaN(slice) || slice === 0) slice = 1; // Default/prevent division by zero
                    dataSegment = dataSegment.substring(0, openBrace) + dataSegment.substring(closeBrace + 1);
                } else break; // Malformed
            }


            if (dataSegment.includes("/")) {
                const subNotes = dataSegment.split("/");
                for (let j = 0; j < subNotes.length; j++) {
                    if (subNotes[j] === "") continue;
                    tempNote.push({ pos: subNotes[j], time: timeSum, bpm });
                }
            } else if (dataSegment.length > 1 && /^\d+$/.test(dataSegment)) { // Multiple notes like "1234"
                for (let j = 0; j < dataSegment.length; j++) {
                    tempNote.push({ pos: dataSegment[j], time: timeSum, bpm });
                }
            } else if (dataSegment) { // Single note or complex type
                tempNote.push({ pos: dataSegment, time: timeSum, bpm });
            }
        }
        timeSum += (1 / slice) * (60 / bpm) * 4000; // Assuming 4000 is correct base
    }
    // Micro-timing with `
    let processedNotes = [];
    for (let i = 0; i < tempNote.length; i++) {
        let note = tempNote[i];
        if (note.pos.includes("`")) {
            const microParts = note.pos.split("`");
            microParts.forEach((part, index) => {
                if (part === "") return;
                processedNotes.push({ ...note, pos: part, time: note.time + index * 10 }); // 10ms offset per backtick
            });
        } else {
            processedNotes.push(note);
        }
    }
    tempNote = processedNotes;
    processedNotes = [];

    // Star slide head with *
     for (let i = 0; i < tempNote.length; i++) {
        let note = tempNote[i];
        if (note.pos.includes("*") && note.pos.length > 1) { // e.g. 1*2-3
            const starParts = note.pos.split("*"); // ["1", "2-3"]
            if (starParts.length > 1 && starParts[0] && starParts[1]) {
                 processedNotes.push({ ...note, pos: starParts[1], head: starParts[0][0] }); // The part after * is the main note, part before is head
            } else {
                 processedNotes.push(note); // Keep original if format is unexpected
            }
        } else {
            processedNotes.push(note);
        }
    }
    tempNote = processedNotes;


    // Parameter parsing for hold, slide durations etc.
    function parseParameter(param, currentBpm) {
        let delaySeconds = 0; // Delay specified before '##'
        let durationStr = param;
        let durationSeconds = 0;
        let effectiveBpm = currentBpm;

        if (param.includes("##")) {
            const parts = param.split("##");
            delaySeconds = parseFloat(parts[0]);
            if (isNaN(delaySeconds)) delaySeconds = 0;
            durationStr = parts[1] || "";
        }

        if (durationStr.includes("#") && durationStr.includes(":")) { // BPM#beats:note_value (e.g., 120#4:16)
            const bpmParts = durationStr.split("#");
            effectiveBpm = parseFloat(bpmParts[0]);
            if (isNaN(effectiveBpm) || effectiveBpm <=0) effectiveBpm = currentBpm;

            const timingParts = (bpmParts[1] || "").split(":");
            const beats = parseFloat(timingParts[0]);
            const noteValue = parseFloat(timingParts[1]); // e.g. 4 for quarter, 8 for eighth
            if (!isNaN(beats) && !isNaN(noteValue) && noteValue > 0 && beats > 0) {
                durationSeconds = (60 / effectiveBpm) * beats * (4 / noteValue);
            }
        } else if (durationStr.includes("#") && !durationStr.startsWith("#")) { // BPM#seconds (e.g., 120#1.5)
            const parts = durationStr.split("#");
            effectiveBpm = parseFloat(parts[0]);
             if (isNaN(effectiveBpm) || effectiveBpm <=0) effectiveBpm = currentBpm;
            durationSeconds = parseFloat(parts[1]);
            if (isNaN(durationSeconds)) durationSeconds = 0;
        } else if (durationStr.includes(":")) { // beats:note_value (e.g., 4:16) using currentBPM
            const timingParts = durationStr.split(":");
            const beats = parseFloat(timingParts[0]);
            const noteValue = parseFloat(timingParts[1]);
            if (!isNaN(beats) && !isNaN(noteValue) && noteValue > 0 && beats > 0) {
                durationSeconds = (60 / currentBpm) * beats * (4 / noteValue);
            }
        } else if (durationStr.startsWith("#")) { // #seconds (e.g., #1.5)
            durationSeconds = parseFloat(durationStr.substring(1));
            if (isNaN(durationSeconds)) durationSeconds = 0;
        } else if (!isNaN(parseFloat(durationStr)) && isFinite(durationStr)) { // direct seconds (e.g., 1.5)
            durationSeconds = parseFloat(durationStr);
        } else {
            // console.warn(`Unknown duration format: ${durationStr} (param: ${param})`);
            durationSeconds = 0; // Default to 0 if unknown
        }

        return {
            delay: delaySeconds, // delay is now in seconds too
            duration: durationSeconds,
            bpm: effectiveBpm,
        };
    }

    const finalNotes = [];
    const flags = { "b": "break", "x": "ex", "f": "hanabi", "$": "star" };

    for (let i = 0; i < tempNote.length; i++) {
        let note = { ...tempNote[i] }; // Shallow copy to modify

        // Apply flags first
        for (const flag in flags) {
            if (note.pos.includes(flag)) {
                note.pos = note.pos.replaceAll(flag, "");
                note[flags[flag]] = true;
            }
        }

        // Hold and Touch Time
        const timeMatch = note.pos.match(/h\[([^[\]]+?)\]/); // Simpler regex for content
        if (timeMatch) {
            const result = parseParameter(timeMatch[1], note.bpm);
            note.holdTime = result.duration; // Duration in seconds
            // Original simai might have delay from h[] influencing note.time itself, TBC.
            // For now, h[] only defines hold duration.
            note.pos = note.pos.replace(timeMatch[0], ""); // Remove h[...]
        }

        const miniHold = note.pos.match(/\dh$/); // e.g. 1h
        if (miniHold) {
            note.holdTime = 1E-9; // Very short duration for "tap" holds
            note.pos = note.pos.replace(/h$/, "");
        }

        // Touch Notes
        const touchMatch = note.pos.match(/([ABCDE])(\d)|(C)/);
        if (touchMatch) {
            if (touchMatch[0] === 'C') {
                note.pos = '1'; // Default position for C touch
                note.touch = 'C';
            } else {
                note.pos = touchMatch[2]; // The digit part
                note.touch = touchMatch[1]; // The letter A,B,D,E
            }
            if (note.holdTime !== undefined) { // If h[] was parsed
                note.touchTime = note.holdTime;
                delete note.holdTime;
            }
             note.pos = note.pos.replace(touchMatch[0], ""); // Clean the touch part from pos if not done
        }


        // Slide Parsing
        // This regex captures slide segments like "1-2[...]" or "2V34[...]"
        // (?:\d+)? allows optional start position for chained slides derived from head
        const slideSegmentRegex = /((?:\d+)?)((?:pp)|(?:qq)|[-<>^vpqszVw])(\d+(?:\.\d+)?(?:[bx$f])*)(\[.*?\])?/g;
        let slideChain = [];
        let lastPos = note.pos[0]; // Initial position for the first segment
        if (note.head) lastPos = note.head; // If defined by * (e.g. 1*2-...)

        let match;
        let remainingPosStr = note.pos;

        // If it's a star slide, the first segment's start comes from `note.head` (e.g. 1* from 1*2-3)
        // and the `note.pos` would be something like "2-3"
        // If not a star slide, `note.pos` is like "1-2-3"

        let currentSlideHead = note.pos[0]; // Default first char of pos string
        if (note.head) { // If 1*... syntax was used
            currentSlideHead = note.head;
            // remainingPosStr is already the part after '*'
        } else {
            // For non-star slides, extract the first position and then process segments
            const firstPosMatch = remainingPosStr.match(/^(\d+)/);
            if (firstPosMatch) {
                currentSlideHead = firstPosMatch[0];
                remainingPosStr = remainingPosStr.substring(currentSlideHead.length);
            } else if (!note.touch && !note.holdTime && remainingPosStr.match(/^((?:pp)|(?:qq)|[-<>^vpqszVw])/)) {
                // This is a "headless" slide e.g. "-1", implies it's a star note from context
                // but `note.head` should have been set. If not, it's a tap.
                // This case should ideally be resolved by `note.head` or making it a tap.
                // For now, let it pass through, might become a tap if no slide segments found.
            }
        }


        let firstSegment = true;
        let slideIndex = 0;
        let cumulativeDelay = 0; // in seconds
        let totalDurationForAutoDistribution = 0; // Store duration from last [bpm#duration]
        let lastParamBpm = note.bpm;

        while ((match = slideSegmentRegex.exec(remainingPosStr)) !== null) {
            let slidePart = { time: note.time, bpm: note.bpm, slide: true };

            // Apply original note's flags (break, ex, star) only to the first segment if it's a star note.
            // Or if the main note itself is a star.
            if (firstSegment && note.star) {
                 slidePart.star = true; // The "tap" part of the star slide
                 if (note.break) slidePart.break = note.break;
                 if (note.ex) slidePart.ex = note.ex;
            }
            firstSegment = false;

            slidePart.slideHead = lastPos;
            slidePart.slideType = match[2]; // Slide type like '-', 'v', 'pp'
            let endPosAndFlags = match[3]; // e.g., "2b", "34x" (V slide target), "5"

            // Extract flags from endPosAndFlags
            for (const flag in flags) {
                if (endPosAndFlags.includes(flag)) {
                    endPosAndFlags = endPosAndFlags.replaceAll(flag, "");
                    slidePart[flags[flag]] = true; // Flag for this specific slide segment
                }
            }
            slidePart.slideEnd = endPosAndFlags; // Now only position string

            const paramStr = match[4]; // Parameter string like "[1#2:4##0.5]" or undefined
            let parsedParams = { delay: 0, duration: 0, bpm: note.bpm };
            if (paramStr) {
                parsedParams = parseParameter(paramStr.slice(1, -1), note.bpm); // Remove brackets
                totalDurationForAutoDistribution = parsedParams.duration; // This duration applies to THIS segment and subsequent ones without their own full duration param
                lastParamBpm = parsedParams.bpm; // BPM from this parameter applies forward
            }

            slidePart.delay = cumulativeDelay + parsedParams.delay; // Add cumulative delay + this segment's own delay from ##
            slidePart.slideTime = parsedParams.duration; // Duration for this specific segment
            slidePart.bpm = parsedParams.bpm; // BPM for this segment's timing calculations

            // CRITICAL: Path object and length calculation
            // This should be done here to avoid DOM access in render loop.
            // `render.path` needs to return an object that includes a Path2D and its calculated length.
            // For simplicity, we'll assume `render.path` is enhanced or we have a math utility.
            // slidePart.pathObject = render.path(slidePart.slideType, slidePart.slideHead, slidePart.slideEnd, 100,100,100, render.calAng); // Example call for path object
            // slidePart.pathLength = slidePart.pathObject.getTotalLength(); // Assumes mathematical calculation

            slideChain.push(slidePart);
            lastPos = slidePart.slideEnd; // Update for next segment
            cumulativeDelay = slidePart.delay + slidePart.slideTime; // Update cumulative delay for next segment
        }

        if (slideChain.length > 0) {
            // If there's a totalDurationForAutoDistribution, and some slides didn't have explicit duration,
            // distribute it. This part is complex and depends on exact simai rules for duration distribution.
            // Placeholder: If a slideTime is 0 and totalDurationForAutoDistribution is set, it might inherit or share.
            // For now, each slide uses its parsed duration or 0.

            // The first note (TAP part of the star slide, or the original note if not star slide)
            const headNote = { ...note }; // Copy original properties
            headNote.pos = currentSlideHead;
            if (slideChain[0].star) headNote.star = true; // If first slide part is star, head is star
            // Remove slide-specific properties from the headNote if it's just a tap
            delete headNote.slide; delete headNote.slideHead; delete headNote.slideType; delete headNote.slideEnd;
            delete headNote.slideTime; delete headNote.delay; delete headNote.pathObject; delete headNote.pathLength;

            if (note.head) { // If it was 1*... this is the "1" tap note
                finalNotes.push(headNote);
            } else if (slideChain.length > 0 && !headNote.touch && headNote.holdTime === undefined) {
                // If it's not a touch/hold, and it's the start of a slide chain, make it a star note.
                headNote.star = true;
                finalNotes.push(headNote);
            } else if (headNote.touch || headNote.holdTime !==undefined) {
                 finalNotes.push(headNote); // Keep touch or hold as is
            }
            // else it's a normal tap that got parsed as slide start, it's already in `note`

            slideChain.forEach((slideSeg, index) => {
                slideSeg.chain = slideChain.length > 1;
                // slideSeg.chainTarget = index < slideChain.length - 1 ? (finalNotes.length + index + 1) : null; // Indexing is tricky
                finalNotes.push(slideSeg);
            });

        } else { // Not a slide, or parsing failed to find segments
            finalNotes.push(note);
        }
    }
    console.log(finalNotes);
    return finalNotes;
}