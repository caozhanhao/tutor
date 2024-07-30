let allWords = new Set();
let currentFocus = -1
let wordsCache = {}
let defaultExerType = ""

mdui.setColorScheme('#0061a4')

async function lookup(word)
{
    const response = await window.tutor.lookup(word)
    return response
}

async function loadVoc(id)
{
    const response = await window.tutor.loadVoc(id)
    if (id === 0)
        vocstr = "初中"
    else if (id === 1)
        vocstr = "高中"
    if (!response)
        mdui.snackbar({ "message": vocstr + "词书加载错误", "placement": "top" })
    else
        mdui.snackbar({ "message": vocstr + "词书加载完成", "placement": "top" })

    let dialog = document.getElementById("book-select-dialog")
    dialog.open = false
    window.sessionStorage.setItem("vocId", id)
    allWords = await window.tutor.getAllWords()
}

function addWordHTML(list, word, exerType)
{
    let item = document.createElement("mdui-list-item")
    item.classList.add("exer-word")
    item.id = word.word
    item.setAttribute('headline', word.word)
    item.setAttribute('description', word.meaning)
    item.innerHTML = '<mdui-segmented-button-group value="' + exerType + '" slot="end-icon" class="exer-type" selects="single">'
        + '<mdui-segmented-button value="cn2en" class="cn2en-option">汉译英</mdui-segmented-button>'
        + '<mdui-segmented-button value="en2cn" class="en2cn-option">英译汉</mdui-segmented-button>'
        + '</mdui-segmented-button-group>'
        + '<mdui-button-icon slot="end-icon" icon="delete" target="_blank" onclick="delWord(\'' + word.word + '\')"></mdui-button-icon>'
    setTimeout(function ()
    {
        item.getElementsByClassName("cn2en-option")[0].addEventListener('click', (event) =>
        {
            if (event.target.parentNode.value == "cn2en")
                event.stopPropagation()
        })
        item.getElementsByClassName("en2cn-option")[0].addEventListener('click', (event) =>
        {
            if (event.target.parentNode.value == "en2cn")
                event.stopPropagation()
        })
    }, 0)
    list.append(item)
    setTimeout(() => { window.scrollTo(0, document.documentElement.scrollHeight) }, 0)
}

function addWord()
{
    let input = document.getElementById("input-word");
    let word_raw = input.value
    let list = document.getElementById("exer-words")

    if (document.getElementById(word_raw) != null)
        mdui.snackbar({ "message": "单词已添加", "placement": "top" })

    lookup(word_raw).then((word) =>
    {
        if (word === null)
        {
            mdui.snackbar({ "message": "单词未找到", "placement": "top" })
            return
        }
        wordsCache[word.word] = word
        addWordHTML(list, word, defaultExerType)
        input.value = '';
    })
}

function delWord(id)
{
    document.getElementById(id).remove()
    mdui.snackbar({ "message": "单词已删除", "placement": "top" })
}

function genExer()
{
    let exerWords = document.getElementsByClassName("exer-word")
    if (exerWords.length == 0)
        return;

    let exerDoc = []
    let answerDoc = [
        new docx.Paragraph({ children: [] }),
        new docx.Paragraph({
            children: [
                new docx.TextRun("-------------------------------------------------------参考答案-------------------------------------------------------")
            ]
        })]
    for (let i = 0; i < exerWords.length; ++i)
    {
        let exerType = exerWords[i].getElementsByClassName("exer-type")[0].value
        let word = wordsCache[exerWords[i].id]

        if (exerType == "cn2en")
        {
            let meaningRun = new docx.TextRun(word.meaning)
            let spaceRun = new docx.TextRun('_'.repeat(word.word.length * 2))
            let answerRun = new docx.TextRun(" " + word.word)

            let exerParagraph = new docx.Paragraph({
                children: [
                    meaningRun, spaceRun
                ]
            })

            let answerParagraph = new docx.Paragraph({
                children: [
                    meaningRun, answerRun
                ]
            })
            exerDoc.push(exerParagraph)
            answerDoc.push(answerParagraph)
        }
        else if (exerType == "en2cn")
        {
            let wordRun = new docx.TextRun(word.word)
            let spaceRun = new docx.TextRun('_'.repeat(word.meaning.length))
            let answerRun = new docx.TextRun(" " + word.meaning)

            let exerParagraph = new docx.Paragraph({
                children: [
                    wordRun, spaceRun
                ]
            })
            let answerParagraph = new docx.Paragraph({
                children: [
                    wordRun, answerRun
                ]
            })
            exerDoc.push(exerParagraph)
            answerDoc.push(answerParagraph)
        }
    }

    const doc = new docx.Document({
        sections: [
            {
                properties: {},
                children: exerDoc.concat(answerDoc)
            }
        ]
    })

    docx.Packer.toBlob(doc).then((blob) =>
    {
        const blobUrl = URL.createObjectURL(blob)
        let date = new Date();
        var filename = "练习-" + date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString()
            + "-" + date.getDate().toString() + ".docx"
        var downloadLink = document.createElement("a")
        document.body.appendChild(downloadLink)
        if (navigator.msSaveOrOpenBlob)
        {
            navigator.msSaveOrOpenBlob(blob, filename)
        }
        else
        {
            downloadLink.href = blobUrl
            downloadLink.download = filename
            downloadLink.click()
        }
        document.body.removeChild(downloadLink)
    })
}

function addAutoComplete(input)
{
    input.addEventListener("input", function (event)
    {
        closeAllLists()
        if (this.value.length < 2) { return false }
        currentFocus = -1
        let a = document.createElement("mdui-card")
        a.setAttribute("variant", "elevated")
        a.id = "autocomplete-list"
        a.classList.add("autocomplete-items")
        document.body.append(a)
        a.style.setProperty('--autocomplete-max-height', (window.innerHeight - 180) + "px");
        let wordsHTML = []
        allWords.forEach((word) =>
        {
            let pos = word.toUpperCase().indexOf(this.value.toUpperCase())
            if (pos !== -1)
            {
                let b = document.createElement("div")
                b.innerHTML = word.slice(0, pos) + "<strong>" + word.slice(pos, pos + this.value.length)
                    + "</strong>" + word.slice(pos + this.value.length)
                b.innerHTML += "<input type='hidden' value=\"" + word + "\">"
                b.addEventListener("click", function (e)
                {
                    input.value = this.getElementsByTagName("input")[0].value
                    closeAllLists()
                })
                if (pos === 0)
                    b.classList.add("head")
                else
                    b.classList.add("middle")
                wordsHTML.push(b)
            }
        })

        wordsHTML.sort((a, b) =>
        {
            if (a.classList[0] == "head" && b.classList[0] == "middle")
            {
                return -1;
            }
            else if (b.classList[0] == "head" && a.classList[0] == "middle")
            {
                return 1;
            }
            else
            {
                return a.getElementsByTagName("input")[0].value.localeCompare(b.getElementsByTagName("input")[0].value)
            }
        })

        wordsHTML.forEach((b) => { a.appendChild(b) })
    })

    input.addEventListener("keydown", function (event)
    {
        let list = document.getElementById("autocomplete-list")
        if (list)
        {
            let x = list.getElementsByTagName("div")
            if (event.keyCode == 40 || event.keyCode == 9)
            {
                currentFocus++
                addActive(x)
                if (list.childElementCount == 1)
                {
                    x[0].click()
                }
                event.preventDefault()
            } else if (event.keyCode == 38)
            {
                currentFocus--
                addActive(x)
                event.preventDefault()
            }
            else if (event.keyCode == 13)
            {
                if (currentFocus > -1)
                {
                    if (x) x[currentFocus].click()
                }
                document.getElementById("add-btn").click();
                event.preventDefault()
            }
        }
        else if (event.keyCode == 13)
        {
            document.getElementById("add-btn").click();
            event.preventDefault()
        }
    })
    function addActive(x)
    {
        if (!x) return false
        removeActive(x)
        if (currentFocus >= x.length) 
        {
            currentFocus = 0
        }
        if (currentFocus < 0)
        {
            currentFocus = (x.length - 1)
        }
        x[currentFocus].classList.add("autocomplete-active")
        let list = document.getElementById("autocomplete-list")
        let y = x[currentFocus].offsetTop - list.clientHeight + list.clientHeight / 2 + x[currentFocus].clientHeight / 2;
        list.scrollTo({
            top: y,
            behavior: "smooth",
        });
    }
    function removeActive(x)
    {
        for (let i = 0; i < x.length; i++)
        {
            x[i].classList.remove("autocomplete-active")
        }
    }
    function closeAllLists(element)
    {
        let x = document.getElementsByClassName("autocomplete-items")
        for (let i = 0; i < x.length; i++)
        {
            if (element != x[i] && element != input)
            {
                x[i].parentNode.removeChild(x[i])
            }
        }
    }
    document.addEventListener("click", function (event)
    {
        closeAllLists(event.target)
    })
}

window.onload = function ()
{
    defaultExerType = window.sessionStorage.getItem("defaultExerType")
    if (defaultExerType === null)
    {
        defaultExerType = "cn2en"
        window.sessionStorage.setItem("defaultExerType", "cn2en")
    }

    const theme = window.sessionStorage.getItem("theme")
    if (theme === null)
        window.sessionStorage.setItem("theme", "auto-mode")

    if (theme === "auto-mode")
        mdui.setTheme("auto")
    else if (theme === "light-mode")
        mdui.setTheme("light")
    else if (theme === "dark-mode")
        mdui.setTheme("dark")

    const vocId = window.sessionStorage.getItem("vocId")
    if (vocId === null)
        document.getElementById("book-select-dialog").setAttribute("open", "true")
    else if (vocId === "0")
        loadVoc(0)
    else if (vocId === "1")
        loadVoc(1)

    const cache = JSON.parse(window.sessionStorage.getItem("exer-cache"))
    if (cache != null)
    {
        wordsCache = cache.wordsCache
        let list = document.getElementById("exer-words")
        for (let i = 0; i < cache.exerWords.length; ++i)
        {
            addWordHTML(list, wordsCache[cache.exerWords[i].id], cache.exerWords[i].exerType)
        }
    }
    addAutoComplete(document.getElementById("input-word"))
}

window.onbeforeunload = function ()
{
    let cache = { "wordsCache": wordsCache, "exerWords": [] }
    let exerWords = document.getElementsByClassName("exer-word")
    for (let i = 0; i < exerWords.length; ++i)
    {
        let exerType = exerWords[i].getElementsByClassName("exer-type")[0].value
        cache.exerWords.push({ "exerType": exerType, "id": exerWords[i].id })
    }
    window.sessionStorage.setItem("exer-cache", JSON.stringify(cache))
}   