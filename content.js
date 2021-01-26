/* global chrome, MutationObserver, Node */

// ==UserScript==
// @name         ChestClicker
// @author       spddl
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

let localPoints = -1

const parsePoints = num => {
  if (num.indexOf('.') === -1) {
    return +num
  } else {
    return num * 1000
  }
}

const createSavedPoints = (targetNode, textContent) => {
  const savedPoints = document.createElement('span')
  savedPoints.id = 'savedPoints'
  savedPoints.style.fontSize = 'smaller'
  savedPoints.style.marginLeft = '5'
  savedPoints.style.cursor = 'pointer'
  savedPoints.style.userSelect = 'none'
  if (textContent) {
    savedPoints.textContent = textContent
  }
  targetNode.appendChild(savedPoints)
}

const createEvent = targetNode => {
  // set transparency on the Points
  targetNode.style.opacity = 0.33

  // hides Chests
  document.querySelector('div.tw-full-height.tw-relative.tw-z-above').style.display = 'none'

  // init Points
  localPoints = parsePoints(targetNode.querySelector('span.tw-animated-number').innerText)
  createSavedPoints(targetNode)

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
          console.log(new Date(), 'Chest')
        }

        const savedPoints = document.getElementById('savedPoints')
        if (savedPoints === null) {
          createSavedPoints(targetNode, '+ ' + Math.round(points - localPoints))
        } else {
          if (points !== localPoints && '+ ' + (points - localPoints) !== savedPoints.textContent) {
            savedPoints.textContent = '+ ' + Math.round(points - localPoints)
          }
        }
      }
    }, 500)
  })
  observer.observe(targetNode, { childList: true, subtree: true })

  window.addEventListener('beforeunload', () => {
    observer.disconnect()
  })
}

const checkDiv = (delay = 0) => {
  setTimeout(() => {
    const CommunityPointsSummary = document.querySelectorAll('div.community-points-summary').length !== 0 ? document.querySelectorAll('div.community-points-summary')[0] : []
    if (CommunityPointsSummary instanceof Node) {
      createEvent(CommunityPointsSummary)
    } else {
      checkDiv(delay + 100 > 1000 ? 1000 : delay + 100)
    }
  }, delay)
}

if (typeof (chrome) !== 'undefined' && chrome.runtime !== 'undefined') {
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
