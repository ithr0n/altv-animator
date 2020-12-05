/**
 * Written by ithr0n (#5837)
 *
 * Disabled NativeUI, because strings are too long for the menu.
 * If you want to enable it, just uncomment the lines.
 *
 * Credits to:
 * - DurtyFree: https://github.com/DurtyFree/gta-v-data-dumps & https://github.com/DurtyFree/alt-V-NativeUI
 * - Hazes: https://forum.gtanet.work/index.php?threads/animator-animation-viewer.4235/
 */

import * as alt from 'alt-client'
import * as natives from 'natives'
//import * as NativeUI from './NativeUI/NativeUI'

const animDicts = JSON.parse(alt.File.read('./animDictsCompact.json'))
const player = alt.Player.local

let animatorEnabled = false
let selectedDictionary = animDicts[0]
let selectedAnimDictIndex = 0
let selectedAnimNameIndex = 0

alt.on('consoleCommand', (command, ...args) => {
    if (command === 'animator') {
        if (args.length > 0) {
            switch (args[0]) {
                case 'help': {
                    alt.log('[Animator] How to use:')
                    alt.log('  * Type "animator" to start or stop the animator.')
                    alt.log('  * Type "animator help" for in-game help.')
                    alt.log('  * Type "animator goto [dictionary] [animation]" to directly go to the defined animation (string or int).')
                    //alt.log('Type "animator ui" to stop currently playing animation.')
                    alt.log('  Use LEFT and RIGHT arrow keys to cycle through animations.')
                    alt.log('  Use UP and DOWN arrow keys to cycle through dictionaries.')

                    break
                }

                /*case 'ui': {
                    if (menu.Visible) {
                        menu.Close()
                    } else {
                        menu.Open()
                    }
                }*/

                case 'goto': {
                    animatorGoto(args)
                    break
                }
            }
        } else {
            animatorEnabled = !animatorEnabled

            if (!animatorEnabled) {
                stopAnim()
            } else {
                playAnim()
            }

            alt.log(`Animator is now ${animatorEnabled ? 'on' : 'off'}. Type "/animator help" for more options.`)
        }
    }
})

alt.on('keyup', (key) => {
    if (!animatorEnabled) {
        return
    }

    switch (key) {
        case 0x25: {
            // left arrow
            gotoPreviousAnimation()
            break
        }

        case 0x26: {
            // up arrow
            if (++selectedAnimDictIndex >= animDicts.length) {
                selectedAnimDictIndex = 0
            }
            selectedDictionary = animDicts[selectedAnimDictIndex]
            selectedAnimNameIndex = 0
            playAnim()
            break
        }

        case 0x27: {
            // right arrow
            gotoNextAnimation()
            break
        }

        case 0x28: {
            // down arrow
            if (--selectedAnimDictIndex < 0) {
                selectedAnimDictIndex = animDicts.length - 1
            }
            selectedDictionary = animDicts[selectedAnimDictIndex]
            selectedAnimNameIndex = 0
            playAnim()
            break
        }
    }
})

alt.everyTick(() => {
    if (!animatorEnabled || selectedAnimDictIndex < 0 || selectedAnimNameIndex < 0) {
        return
    }

    drawLongText('Animation:', 0.75, 0.72, 0.86, 4, 255, 255, 255, 255, true, true, false)
    drawLongText(`${selectedDictionary.DictionaryName}`, 0.75, 0.77, 0.48, 4, 255, 255, 0, 255, true, true, false)
    drawLongText(`${selectedDictionary.Animations[selectedAnimNameIndex]}`, 0.75, 0.8, 0.48, 4, 70, 126, 159, 255, true, true, false)
})

const gotoNextAnimation = () => {
    if (++selectedAnimNameIndex >= selectedDictionary.Animations.length) {
        selectedAnimNameIndex = 0

        if (++selectedAnimDictIndex >= animDicts.length) {
            selectedAnimDictIndex = 0
        }

        selectedDictionary = animDicts[selectedAnimDictIndex]
    }

    playAnim()
}

const gotoPreviousAnimation = () => {
    if (--selectedAnimNameIndex < 0) {
        selectedAnimNameIndex = selectedDictionary.Animations.length - 1

        if (--selectedAnimDictIndex < 0) {
            selectedAnimDictIndex = animDicts.length - 1
        }

        selectedDictionary = animDicts[selectedAnimDictIndex]
    }

    playAnim()
}

const drawLongText = (text, x, y, scale, fontType, r, g, b, a, useOutline = true, useDropShadow = true, center = false) => {
    natives.setTextFont(fontType)
    natives.setTextProportional(false)
    natives.setTextScale(scale, scale)
    natives.setTextColour(r, g, b, a)
    natives.setTextEdge(2, 0, 0, 0, 150)

    if (useOutline) {
        natives.setTextOutline()
    }
    if (useDropShadow) {
        natives.setTextDropshadow(0, 0, 0, 0, 255)
        natives.setTextDropShadow()
    }

    natives.setTextCentre(center)
    natives.beginTextCommandDisplayText('CELL_EMAIL_BCON')

    text.match(/.{1,99}/g).forEach((textBlock) => {
        natives.addTextComponentSubstringPlayerName(textBlock)
    })
    natives.endTextCommandDisplayText(x, y, 0.0)
}

const stopAnim = () => {
    natives.clearPedTasks(player.scriptID)
    natives.clearPedSecondaryTask(player.scriptID)
}

const playAnim = () => {
    stopAnim()

    let res = loadAnim(selectedDictionary.DictionaryName)

    res.then(() => {
        natives.taskPlayAnim(
            player.scriptID,
            selectedDictionary.DictionaryName,
            selectedDictionary.Animations[selectedAnimNameIndex],
            1, // speed, always 1
            -1, // speed multiplier - dunno, always -1
            -1, // duration, always -1 works :)
            1, // flags: repeat
            1, // playbackrate - dunno, always 1
            false,
            false,
            false
        )
    })

    alt.log('[Animator]')
    alt.log(`  Dictionary: ${selectedDictionary.DictionaryName}`)
    alt.log(`  Animation: ${selectedDictionary.Animations[selectedAnimNameIndex]}`)
}

const loadAnim = (dictName) => {
    return new Promise((resolve, reject) => {
        if (!natives.doesAnimDictExist(dictName)) {
            reject(new Error(`Animation dictionary does not exist: ${dictName}`))
            return
        }

        if (natives.hasAnimDictLoaded(dictName)) {
            resolve(true)
            return
        }

        natives.requestAnimDict(dictName)

        const deadline = new Date().getTime() + 1000 * 10

        const inter = alt.setInterval(() => {
            if (natives.hasAnimDictLoaded(dictName)) {
                alt.clearInterval(inter)
                //alt.log(`Animation dictionary loaded: ${dictName}`)
                resolve(true)
            } else if (deadline < new Date().getTime()) {
                alt.clearInterval(inter)
                const error = `Error: Async loading failed for animation dictionary: ${dictName}`
                alt.log(error)
                reject(new Error(error)) // probably better resolve(false)
            }
        }, 10)
    })
}

// ui - works, but strings are too long for NativeUI
/*
const getDictsAsItemCollection = () => {
    const items = []
    animDicts.forEach((e) => items.push(e.DictionaryName))

    return new NativeUI.ItemsCollection(items)
}

const getAnimsForSelectedDictionaryAsItemCollection = () => {
    const items = []
    selectedDictionary.Animations.forEach((e) => items.push(e))

    return new NativeUI.ItemsCollection(items)
}

const dictList = new NativeUI.UIMenuListItem('Dictionary:', 'Select the animation dictionary', getDictsAsItemCollection())
const animList = new NativeUI.UIMenuListItem('Animation:', 'Select the animation name', getAnimsForSelectedDictionaryAsItemCollection())
const playButton = new NativeUI.UIMenuCheckboxItem('Play Animation', false)

let menu = new NativeUI.Menu('Animator', 'Try out all the animations', new NativeUI.Point(50, 50))
menu.GetTitle().Scale = 1.5
menu.AddItem(dictList)
menu.AddItem(animList)
menu.AddItem(playButton)

menu.ListChange.on((item, newListItemIndex) => {
    if (item === dictList) {
        selectedAnimDictIndex = newListItemIndex
        selectedDictionary = animDicts[selectedAnimDictIndex]
        selectedAnimNameIndex = 0

        animList.setCollection(getAnimsForSelectedDictionaryAsItemCollection())
        animList.Index = 0

        if (playButton.Checked) {
            playAnim()
        }
    } else if (item === animList) {
        selectedAnimNameIndex = newListItemIndex

        if (playButton.Checked) {
            playAnim()
        }
    }
})

menu.CheckboxChange.on((item, checkedState) => {
    if (item === playButton) {
        animatorEnabled = checkedState

        if (checkedState) {
            playAnim()
        } else {
            stopAnim()
        }
    }
})
*/

const animatorGoto = (args) => {
    if (args.length >= 2) {
        const oldAnimDictIndex = selectedAnimDictIndex

        let dictValid = false
        if (+args[1] && +args[1] >= 0 && +args[1] < animDicts.length) {
            selectedAnimDictIndex = +args[1]
            selectedDictionary = animDicts[selectedAnimDictIndex]
            dictValid = true
        } else {
            for (let i = 0; i < animDicts.length; i++) {
                if (animDicts[i].DictionaryName === args[1]) {
                    selectedAnimDictIndex = i
                    selectedDictionary = animDicts[selectedAnimDictIndex]
                    dictValid = true
                }
            }
        }

        if (!dictValid) {
            alt.log('test')
            selectedAnimDictIndex = oldAnimDictIndex
            return
        }

        selectedAnimNameIndex = 0

        if (args.length >= 3) {
            if (+args[2] && +args[2] >= 0 && +args[2] < selectedDictionary.Animations.length) {
                selectedAnimNameIndex = +args[2]
            } else {
                for (let i = 0; i < selectedDictionary.Animations.length; i++) {
                    if (selectedDictionary.Animations[i] === args[2]) {
                        selectedAnimNameIndex = i
                    }
                }
            }
        }

        // update ui
        /*
        dictList.Index = selectedAnimDictIndex
        animList.Collection = getAnimsForSelectedDictionaryAsItemCollection()
        animList.Index = selectedAnimNameIndex
        */

        playAnim()
    }
}
