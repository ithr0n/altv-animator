/**
 * Written by ithr0n (#5837)
 *
 * Credits to:
 * - DurtyFree: https://github.com/DurtyFree/gta-v-data-dumps & https://github.com/DurtyFree/alt-V-NativeUI
 * - Hazes: https://forum.gtanet.work/index.php?threads/animator-animation-viewer.4235/
 */

import * as alt from 'alt-client'
import * as natives from 'natives'
import * as NativeUI from './NativeUI/NativeUI'

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
                    alt.log('Type "animator" to start or stop the animator.')
                    alt.log('Type "animator help" for in-game help.')
                    alt.log('Type "animator goto [dictionary] [animation]" to directly go to the defined animation (string or int).')
                    alt.log('Type "animator ui" to stop currently playing animation.')
                    alt.log('')
                    alt.log('Use LEFT and RIGHT arrow keys to cycle through animations.')
                    alt.log('Use UP and DOWN arrow keys to cycle through 100 animations at once.')

                    break
                }

                case 'ui': {
                    if (menu.Visible) {
                        menu.Close()
                    } else {
                        menu.Open()
                    }
                }

                case 'goto': {
                    if (args.length >= 2) {
                        let dictValid = false
                        if (+args[1]) {
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

                        selectedAnimNameIndex = 0

                        if (args.length >= 3) {
                            if (+args[2]) {
                                selectedAnimNameIndex = +args[2]
                            } else {
                                for (let i = 0; i < selectedDictionary.Animations.length; i++) {
                                    if (selectedDictionary.Animations[i] === args[2]) {
                                        selectedAnimNameIndex = i
                                    }
                                }
                            }
                        }

                        playAnim()
                    }
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
            for (let i = 0; i < 100; i++) {
                gotoNextAnimation()
            }
            break
        }

        case 0x27: {
            // right arrow
            gotoNextAnimation()
            break
        }

        case 0x28: {
            // down arrow
            for (let i = 0; i < 100; i++) {
                gotoPreviousAnimation()
            }
            break
        }
    }
})

alt.everyTick(() => {
    if (!animatorEnabled || selectedAnimDictIndex < 0 || selectedAnimNameIndex < 0) {
        return
    }

    drawLongText(`Dictionary (idx ${selectedAnimDictIndex}): ${selectedDictionary.DictionaryName}`, 0.75, 0.75, 0.8, 7, 255, 255, 255, 255, true, true, true)
    drawLongText(`Animation Name: ${selectedDictionary.Animations[selectedAnimNameIndex]}`, 0.75, 0.85, 0.8, 7, 255, 255, 255, 255, true, true, true)
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
            -1, // speed multiplier, always -1
            -1, // duration
            1, // flags: repeat
            1, // playbackrate, always 1
            false,
            false,
            false
        )
    })

    /*
    NativeUI.MidsizedMessage.ShowMidsizedShardMessage(
        `Dictionary (${selectedAnimDictIndex}): ${selectedDictionary.DictionaryName}`,
        `Animation: ${selectedDictionary.Animations[selectedAnimNameIndex]}`,
        NativeUI.HudColor.HUD_COLOUR_BLACK,
        true,
        true
    )
    */
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

// ui
const getAnimsForSelectedDictionaryAsItemCollection = () => {
    const items = []
    selectedDictionary.Animations.forEach((e) => items.push(e))

    return new NativeUI.ItemsCollection(items)
}

const onAnimDictDynamicListItemChange = (item, selectedValue, changeDirection) => {
    if (changeDirection === NativeUI.ChangeDirection.Right) {
        if (++selectedAnimDictIndex >= animDicts.length) {
            selectedAnimDictIndex = 0
        }
    } else {
        if (--selectedAnimDictIndex < 0) {
            selectedAnimDictIndex = animDicts.length - 1
        }
    }
    selectedDictionary = animDicts[selectedAnimDictIndex]
    selectedAnimNameIndex = 0

    animList.setCollection(getAnimsForSelectedDictionaryAsItemCollection())
    animList.Index = 0

    if (playButton.Checked) {
        playAnim()
    }

    return selectedDictionary.DictionaryName
}

const dictList = new NativeUI.UIMenuDynamicListItem(
    'Dictionary:',
    onAnimDictDynamicListItemChange,
    'Select the animation dictionary',
    () => selectedDictionary.DictionaryName
)

const animList = new NativeUI.UIMenuListItem('Animation:', 'Select the animation name', getAnimsForSelectedDictionaryAsItemCollection())

const playButton = new NativeUI.UIMenuCheckboxItem('Play Animation', false)

let menu = new NativeUI.Menu('Animator', 'Try out all the animations', new NativeUI.Point(50, 50))
menu.GetTitle().Scale = 1.5
menu.AddItem(dictList)
menu.AddItem(animList)
menu.AddItem(playButton)

menu.ItemSelect.on((selectedItem, selectedItemIndex) => {
    if (selectedItem === dictList) {
        if (selectedItem.Checked) {
            playAnim()
        } else {
            stopAnim()
        }
    }
})

menu.ListChange.on((item, newListItemIndex) => {
    if (item === animList) {
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
