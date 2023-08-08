import React from 'react';

function getContentLength(element) {
    var stack = [element];
    var total = 0;
    var current;
    
    while(current = stack.pop()) {
        for(var i = 0; i < current.childNodes.length; i++) {
            if(current.childNodes[i].nodeType === 1) {
                stack.push(current.childNodes[i]);
            } else if(current.childNodes[i].nodeType === 3) {
                total += current.childNodes[i].nodeValue.length;
            }
        }
    }
    
    return total;
}

export function getSelectionOffsetFrom(parent) {
    var sel = window.getSelection();
    var current = sel.anchorNode;
    var offset = sel.anchorOffset;

    while(current && current !== parent) {
        var sibling = current;

        while(sibling = sibling.previousSibling) {
            if(sibling.nodeType === 3) {
                offset += sibling.nodeValue.length;
            } else if(sibling.nodeType === 1) {
                offset += getContentLength(sibling);
            }
        }

        current = current.parentNode;
    }

    if(!current) {
        return null;
    }

    return offset;
}

export const showSrcTmxIndicator = (source, tmxArr) => {
    let modifiedArray = []
    console.log("source --- ", source);
    console.log("tmxArr --- ", tmxArr);
    source && source.split(' ').forEach((word, i) => {
        var wordObj = {
            word: "",
            visited: false
        }
        tmxArr.forEach(tmx => {
            if (tmx.src_phrase.split(' ').length === 1) {
                if (word.startsWith(tmx.src_phrase) && word !== wordObj.word && !wordObj.visited) {
                    wordObj.word = word
                    wordObj.visited = true
                    modifiedArray.push(<span key={i}>
                        <span style={{ borderBottom: `3px solid ${tmx.src_color}`, fontWeight: 'bold' }}>{word.slice(0, tmx.src_phrase.length)}</span>
                        {word.length > tmx.src_phrase.length && <span>{word.slice(tmx.src_phrase.length, word.length)}</span>}
                        </span>)
                    modifiedArray.push(" ")
                }
            } else {
                tmx.src_phrase.split(' ').forEach(val => {
                    if (word.startsWith(val) && word !== wordObj.word && !wordObj.visited) {
                        wordObj.word = word
                        wordObj.visited = true
                        // modifiedArray.push(<span key={i} style={{ borderBottom: `3px solid ${tmx.src_color}`, fontWeight: 'bold' }}>{word}</span>)
                        modifiedArray.push(<span key={i}>
                            <span style={{ borderBottom: `3px solid ${tmx.src_color}`, fontWeight: 'bold' }}>{word.slice(0, val.length)}</span>
                            {word.length > val.length && <span>{word.slice(val.length, word.length)}</span>}
                            </span>)
                        modifiedArray.push(" ")
                    }
                })
            }
        })
        if (!wordObj.visited && wordObj.word !== word) {
            modifiedArray.push(word)
            modifiedArray.push(" ")
        }
    })
    return modifiedArray
}

export const showTgtTmxIndicator = (source, tmxArr) => {
    let modifiedArray = []
    source && source.split(' ').forEach((word, i) => {
        var wordObj = {
            word: "",
            visited: false
        }
        tmxArr.forEach(tmx => {
            if (tmx.tmx_tgt.split(' ').length === 1) {
                if (word.startsWith(tmx.tmx_tgt) && word !== wordObj.word && !wordObj.visited) {
                    wordObj.word = word
                    wordObj.visited = true
                    // modifiedArray.push(<span key={i} style={{ borderBottom: `3px solid ${tmx.tgt_color}`, fontWeight: 'bold' }}>{word}</span>)
                    modifiedArray.push(<span key={i}>
                        <span style={{ borderBottom: `3px solid ${tmx.tgt_color}`, fontWeight: 'bold' }}>{word.slice(0, tmx.tmx_tgt.length)}</span>
                        {word.length > tmx.tmx_tgt.length && <span>{word.slice(tmx.tmx_tgt.length, word.length)}</span>}
                        </span>)
                    modifiedArray.push(" ")
                }
            } else {
                tmx.tmx_tgt.split(' ').forEach(val => {
                    if (word.startsWith(val) && word !== wordObj.word && !wordObj.visited) {
                        wordObj.word = word
                        wordObj.visited = true
                        // modifiedArray.push(<span key={i} style={{ borderBottom: `3px solid ${tmx.tgt_color}`, fontWeight: 'bold' }}>{word}</span>)
                        modifiedArray.push(<span key={i}>
                            <span style={{ borderBottom: `3px solid ${tmx.tgt_color}`, fontWeight: 'bold' }}>{word.slice(0, val.length)}</span>
                            {word.length > val.length && <span>{word.slice(val.length, word.length)}</span>}
                            </span>)
                        modifiedArray.push(" ")
                    }
                })
            }
        })
        if (!wordObj.visited && wordObj.word !== word) {
            modifiedArray.push(word)
            modifiedArray.push(" ")
        }
    })
    return modifiedArray
}