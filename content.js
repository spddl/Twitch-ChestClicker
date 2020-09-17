/* global chrome, MutationObserver */

// ==UserScript==
// @name         ChestClicker
// @author       spddl
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

let localPoints = -1
let lastPointsUpdate = 0
let lastUpdate = +new Date()
let lastChestUpdate = +new Date()

const parsePoints = num => {
    if (num.indexOf('.') === -1) {
        return Math.round(+num)
    } else {
        return num * 1000
    }
}

const createEvent = targetNode => {
    // set transparency on the Points
    targetNode.style.opacity = 0.33

    // hides Chests
    document.querySelector('div.tw-full-height.tw-relative.tw-z-above').style.display = 'none'

    // init Points
    localPoints = parsePoints(targetNode.querySelector('span.tw-animated-number').innerText)

    const savedPoints = document.createElement('span')
    savedPoints.id = 'savedPoints'
    savedPoints.style.fontSize = 'smaller'
    savedPoints.style.marginLeft = '5'
    savedPoints.style.cursor = 'pointer'
    savedPoints.style.userSelect = 'none'
    targetNode.appendChild(savedPoints)

    let timeoutID
    const observer = new MutationObserver(() => { // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
        window.clearTimeout(timeoutID)
        timeoutID = window.setTimeout(() => {
            const CommunityPointsSummary = document.querySelectorAll('div.community-points-summary').length !== 0 ? document.querySelectorAll('div.community-points-summary')[0] : []
            if (CommunityPointsSummary) {
                const points = parsePoints(CommunityPointsSummary.querySelector('span.tw-animated-number').innerText)

                const checkButton = CommunityPointsSummary.querySelectorAll('button.tw-button')
                if (checkButton.length !== 0) {
                    checkButton[0].click() // Click the Chest
                    console.log(new Date(), "Chest")
                }

                const savedPoints = document.getElementById('savedPoints')
                if (points !== localPoints && '+ ' + (points - localPoints) !== savedPoints.textContent) {
                    savedPoints.textContent = '+ ' + (points - localPoints)
                }
            }
        }, 500)
    })
    observer.observe(targetNode, { childList: true, subtree: true })

    window.addEventListener('beforeunload', () => {
        observer.disconnect()
    })
}

const checkDiv = () => {
    setTimeout(() => {
        const CommunityPointsSummary = document.querySelectorAll('div.community-points-summary').length !== 0 ? document.querySelectorAll('div.community-points-summary')[0] : []
        if (CommunityPointsSummary instanceof Node) {
            createEvent(CommunityPointsSummary)
        } else {
            checkDiv()
        }
    }, 500)
}

if (typeof(chrome) != "undefined" && chrome.runtime != "undefined" ) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.text === 'createEvent') {
            if (window.savedPoints) {
                sendResponse(false)
            } else {
                window.savedPoints = true
                checkDiv()
                sendResponse(true)
            }
        }
    })
} else {
    checkDiv()
}