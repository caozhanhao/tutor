let currVersion = ""
let updateServer = ""

mdui.setColorScheme('#0061a4')

async function openGithubProfile()
{
    await window.tutor.openGithubProfile()
}

async function openGithubProject()
{
    await window.tutor.openGithubProject()
}

function openReleaseDialog(latestVersion, description, link)
{
    let dialog = document.getElementById("release-dialog")
    let headline = document.getElementById("release-headline")
    let descr = document.getElementById("release-description")
    let btn = document.getElementById("release-btn")

    headline.innerHTML = "Tutor v" + latestVersion
    descr.innerHTML = marked.marked(description)
    btn.onclick = () =>
    {
        location.href = link
        document.getElementById("release-dialog").open = false
    }
    dialog.open = true
}

function versionCmp(v1, v2)
{
    let a1 = v1.split('.')
    let a2 = v2.split('.')
    const length = Math.max(v1.length, v2.length)
    while (v1.length < length)
        v1.push('0')
    while (v2.length < length)
        v2.push('0')

    for (let i = 0; i < length; i++)
    {
        const n1 = parseInt(v1[i])
        const n2 = parseInt(v2[i])
        if (n1 > n2)
            return 1
        else if (n1 < n2)
            return -1
    }
    return 0
}


function checkUpdate()
{
    if (updateServer.slice(-1) != "/")
        updateServer += "/"
    mdui.snackbar({ "message": "正在检查更新", "placement": "top" })
    fetch(updateServer)
        .then(response =>
        {
            if (!response.ok)
                throw Error(response.status + " " + response.statusText)
            else
                return response.json()
        }).then(
            (res) =>
            {
                let latestVersion = res.tag_name.slice(1)
                const cmp = versionCmp(currVersion, latestVersion)
                if (cmp === 0)
                    mdui.snackbar({ "message": "当前已为最新版本", "placement": "top" })
                else if (cmp === 1)
                {
                    mdui.snackbar({
                        "message": "警告：本地版本(" + currVersion + ") 比远程版本(" + latestVersion + ")更新。"
                        , "placement": "top"
                    })
                }
                else
                {
                    for (let i = 0; i < res.assets.length; ++i)
                    {
                        let n = res.assets[i].name
                        if (n.slice(n.lastIndexOf(".")) == ".exe")
                        {
                            openReleaseDialog(latestVersion, res.body, updateServer + res.assets[i].id)
                            return
                        }
                    }
                }
            })
        .catch((error) =>
        {
            mdui.snackbar({ "message": "检查更新失败, " + error, "placement": "top" })
        });
}

function editUpdateServer()
{
    updateServer = document.getElementById("update-server-value").value
    window.sessionStorage.setItem("updateServer", updateServer)
    document.getElementById("update-server-editor").setAttribute("description", updateServer)
    document.getElementById('edit-server-dialog').open = false
}

window.onload = function ()
{
    updateServer = window.sessionStorage.getItem("updateServer")
    if (updateServer === null)
        updateServer = "http://update.tutor.mkfs.tech/"

    document.getElementById("update-server-editor").setAttribute("description", updateServer)
    document.getElementById("update-server-value").value = updateServer

    window.tutor.getVersion().then((version) =>
    {
        currVersion = version
        document.getElementById('version-info').innerHTML = '版本：' + currVersion
    })

    const vocId = window.sessionStorage.getItem("vocId")
    if (vocId === "0")
    {
        document.getElementById("voc-selector").setAttribute("description", "初中")
        document.getElementById("voc-selector-value").value = "voc0"
    }
    else if (vocId === "1")
    {
        document.getElementById("voc-selector").setAttribute("description", "高中")
        document.getElementById("voc-selector-value").value = "voc1"
    }
    document.getElementsByClassName("voc0-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "voc0")
            event.stopPropagation()
    })
    document.getElementsByClassName("voc1-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "voc1")
            event.stopPropagation()
    })
    document.getElementById("voc-selector-value").addEventListener('change', (event) =>
    {
        if (event.target.value == 'voc0')
        {
            window.sessionStorage.setItem("vocId", "0")
            document.getElementById("voc-selector").setAttribute("description", "初中")
        }
        else if (event.target.value == 'voc1')
        {
            window.sessionStorage.setItem("vocId", "1")
            document.getElementById("voc-selector").setAttribute("description", "高中")
        }
    })

    const theme = window.sessionStorage.getItem("theme")
    if (theme === "auto-mode")
    {
        document.getElementById("theme-selector").setAttribute("description", "跟随系统")
        document.getElementById("theme-selector-value").value = "auto-mode"
    }
    else if (theme === "light-mode")
    {
        document.getElementById("theme-selector").setAttribute("description", "亮色模式")
        document.getElementById("theme-selector-value").value = "light-mode"
    }
    else if (theme === "dark-mode")
    {
        document.getElementById("theme-selector").setAttribute("description", "暗色模式")
        document.getElementById("theme-selector-value").value = "dark-mode"
    }
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
    document.getElementById("theme-selector-value").addEventListener('change', (event) =>
    {
        if (event.target.value == 'light-mode')
        {
            mdui.setTheme('light')
            document.getElementById("theme-selector").setAttribute("description", "亮色模式")
        }
        else if (event.target.value == "dark-mode")
        {
            mdui.setTheme('dark')
            document.getElementById("theme-selector").setAttribute("description", "暗色模式")
        }
        else if (event.target.value == "auto-mode")
        {
            mdui.setTheme('auto')
            document.getElementById("theme-selector").setAttribute("description", "跟随系统")
        }
        window.sessionStorage.setItem("theme", event.target.value)
    })

    const defaultExerType = window.sessionStorage.getItem("defaultExerType")
    if (defaultExerType === "cn2en")
    {
        document.getElementById("exer-type-selector").setAttribute("description", "汉译英")
        document.getElementById("exer-type-selector-value").value = "cn2en"
    }
    else if (defaultExerType === "en2cn")
    {
        document.getElementById("exer-type-selector").setAttribute("description", "英译汉")
        document.getElementById("exer-type-selector-value").value = "en2cn"
    }
    document.getElementsByClassName("cn2en-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "cn2en")
            event.stopPropagation()
    })
    document.getElementsByClassName("en2cn-option")[0].addEventListener('click', (event) =>
    {
        if (event.target.parentNode.value == "en2cn")
            event.stopPropagation()
    })
    document.getElementById("exer-type-selector-value").addEventListener('change', (event) =>
    {
        if (event.target.value == 'en2cn')
        {
            window.sessionStorage.setItem("defaultExerType", "en2cn")
            document.getElementById("exer-type-selector").setAttribute("description", "英译汉")
        }
        else if (event.target.value == 'cn2en')
        {
            window.sessionStorage.setItem("defaultExerType", "cn2en")
            document.getElementById("exer-type-selector").setAttribute("description", "汉译英")
        }
    })

    const color = window.sessionStorage.getItem("color")
    document.getElementById("color-selector").setAttribute("description", getColorName(color))
    mdui.setColorScheme(color)

    let presetColors = document.getElementsByClassName("color-preset")[0].children
    for (let i = 0; i < presetColors.length; ++i)
    {
        presetColors[i].addEventListener('click', (event) =>
        {
            let rgb = getComputedStyle(presetColors[i]).backgroundColor.slice(4, -1).split(',')
            let hex = rgb2hex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]))
            mdui.setColorScheme(hex)
            window.sessionStorage.setItem("color", hex)
            document.getElementById("color-selector").setAttribute("description", getColorName(hex))
        })
    }

    document.getElementsByClassName("color-custom")[0].addEventListener('change', (event) =>
    {
        mdui.setColorScheme(event.target.value)
        window.sessionStorage.setItem("color", event.target.value)
        document.getElementById("color-selector").setAttribute("description", getColorName(event.target.value))
    })
}

function rgb2hex(r, g, b)
{
    let reg = /^\d{1,3}$/
    if (!reg.test(r) || !reg.test(g) || !reg.test(b))
        return
    let hex = [r.toString(16), g.toString(16), b.toString(16)]
    for (let i = 0; i < 3; i++)
    {
        if (hex[i].length === 1) hex[i] = `0${hex[i]}`
    }
    return `#${hex.join('')}`
}

function getColorName(c)
{
    let s = "预设颜色："
    switch (c)
    {
        case '#bb1614':
        case '#ffb4aa':
            return s + "红色"
        case '#9a25ae':
        case '#f9abff':
            return s + "紫色"
        case '#0061a4':
        case '#9ecaff':
            return s + "蓝色"
        case '#006e1c':
        case '#78dc77':
            return s + "绿色"
        case '#695f00':
        case '#dbc90a':
            return s + "黄色"
        case '#006874':
        case '#4fd8eb':
            return s + "灰绿色"
    }
}