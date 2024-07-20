let allWords = new Set();
let currentFocus = -1
let wordsCache = {}
let currVersion = ""

mdui.setColorScheme('#0061a4');

async function openGithubProfile()
{
    await window.tutor.openGithubProfile()
}

async function openGithubProject()
{
    await window.tutor.openGithubProject()
}

async function init()
{
    allWords = await window.tutor.getAllWords()
    currVersion = await window.tutor.getVersion()
}
init()

async function lookup(word)
{
    const response = await window.tutor.lookup(word)
    return response
}

function id2bookname(id)
{
    switch (id)
    {
        case 71: return "七年级上册"
        case 72: return "七年级下册"
        case 81: return "八年级上册"
        case 82: return "八年级下册"
        case 91: return "九年级全一册"
    }
}

function word2id(word)
{
    let id = word.word.replaceAll(' ', '-').replaceAll('?', '-').replaceAll('.', '-')
        .replaceAll('·', '-').replaceAll('\'', '-').replaceAll('"', '-')
    id += word.book.toString() + word.unit.toString()
    return id
}


function id2unitname(id)
{
    if (id < 0) return "Starter Unit " + (-id).toString()
    else return "Unit " + id.toString()
}

function addWord()
{
    let input = document.getElementById("input-word");
    let word = input.value
    let list = document.getElementById("exer-words")

    lookup(word).then((res) =>
    {
        res.forEach(word =>
        {
            let id = word2id(word)
            wordsCache[id] = word
            if (document.getElementById(id) === null)
            {
                let item = document.createElement("mdui-list-item")
                item.classList.add("exer-word")
                item.id = id
                item.setAttribute('headline', word.word)
                item.setAttribute('description', word.meaning)
                item.innerHTML = '<mdui-segmented-button-group value="cn2en" slot="end-icon" class="exer-type" selects="single">'
                    + '<mdui-segmented-button value="cn2en" class="cn2en-option">汉译英</mdui-segmented-button>'
                    + '<mdui-segmented-button value="en2cn" class="en2cn-option">英译汉</mdui-segmented-button>'
                    + '</mdui-segmented-button-group>'
                    + '<mdui-button-icon slot="end-icon" icon="delete" target="_blank" onclick="delWord(\'' + id + '\')"></mdui-button-icon>'
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
                input.value = '';
            }
            else
            {
                mdui.snackbar({ "message": "单词已添加", "placement": "top" })
            }
        })
        if (res.length == 0)
        {
            mdui.snackbar({ "message": "单词未找到", "placement": "top" })
        }
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
    {
        return;
    }

    let x = []
    for (let i = 0; i < exerWords.length; ++i)
    {
        let exerType = exerWords[i].getElementsByClassName("exer-type")[0].value
        let word = wordsCache[exerWords[i].id]

        if (exerType == "cn2en")
        {
            let meaningRun = new docx.TextRun(word.meaning)
            let spaceRun = new docx.TextRun('_'.repeat(word.word.length * 2))
            let paragraph = new docx.Paragraph({
                children: [
                    meaningRun, spaceRun
                ]
            })
            x.push(paragraph)
        }
        else if (exerType == "en2cn")
        {
            let wordRun = new docx.TextRun(word.word)
            let spaceRun = new docx.TextRun('_'.repeat(word.meaning.length))
            let paragraph = new docx.Paragraph({
                children: [
                    wordRun, spaceRun
                ]
            })
            x.push(paragraph)
        }
    }

    const doc = new docx.Document({
        sections: [
            {
                properties: {},
                children: x
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

function openReleaseDialog(latestVersion, description, link)
{
    let dialog = document.getElementById("release-dialog")
    let headline = document.getElementById("release-headline")
    let descr = document.getElementById("release-description")
    let btn = document.getElementById("release-btn")

    headline.innerHTML = "Tutor v" + latestVersion
    descr.innerHTML = description
    btn.onclick = () => { location.href = link; document.getElementById("release-dialog").open = false }
    dialog.open = true
}

function checkUpdate()
{
    try
    {
        fetch("https://api.github.com/repos/caozhanhao/tutor/releases/latest")
            .then(response => response.json()).then(
                (res) =>
                {
                    let latestVersion = res.tag_name.slice(1)
                    if (currVersion == latestVersion)
                    {
                        mdui.snackbar({ "message": "当前已为最新版本", "placement": "top" })
                    }
                    else
                    {
                        for (let i = 0; i < res.assets.length; ++i)
                        {
                            let n = res.assets[i].name
                            if (n.slice(n.lastIndexOf(".")) == ".exe")
                            {
                                openReleaseDialog(latestVersion, res.body, res.assets[i].browser_download_url)
                                return
                            }
                        }
                    }
                })
    }
    finally
    {
        mdui.snackbar({ "message": "检查更新失败", "placement": "top" })
    }
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
    document.getElementById("version-info").innerHTML = "版本：" + currVersion
    addAutoComplete(document.getElementById("input-word"))
    document.getElementsByClassName("light-mode-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "light-mode")
            event.stopPropagation()
    })
    document.getElementsByClassName("dark-mode-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "dark-mode")
            event.stopPropagation()
    })
    document.getElementsByClassName("auto-mode-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "auto-mode")
            event.stopPropagation()
    })
    document.getElementById("theme-selector").addEventListener('change', (event) =>
    {
        if (event.target.value == 'light-mode')
            mdui.setTheme('light')
        else if (event.target.value == "dark-mode")
            mdui.setTheme('dark')
        else if (event.target.value == "auto-mode")
            mdui.setTheme('auto')
    })
}