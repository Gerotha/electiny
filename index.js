const {ipcRenderer, shell} = require('electron')
const path = require('path')
const fs = require('fs')



// disable accidental drop a file in there
document.addEventListener('dragover', (event) => {
    event.preventDefault()
    return false
}, false)

document.addEventListener('drop', (event) => {
    event.preventDefault()
    return false
}, false)

// my app
let app = angular.module('electronTinypng', ['mui', 'ngFileUpload', 'toastr'])

app.controller('mainController', ($scope, toastr) => {

    // usage number
    $scope.usage = 'N/A'

    ipcRenderer.on('async-count-update', (event, arg) => {
        if (arg.success) {
            $scope.$apply(() => {
                $scope.usage = arg.data
            })
        } else {
            handleError(arg.data)
        }
    })

    // compress files
    $scope.filesToCompress = []

    ipcRenderer.on('async-compress-file-reply', (event, arg) => {
        $scope.$apply(() => {
            angular.forEach($scope.filesToCompress, (file, index) => {
                if (arg.data.id === file.id) {
                    $scope.filesToCompress[index] = arg.data
                }
            })
        })
    })

    $scope.compressFiles = (files) => {
        angular.forEach(files, (file, index) => {
            if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
                toastr.warning('File ' + file.name + ' is not a PNG or JPG file so it was ignored.', 'File Ignored')
                return
            }
            
            let f = {}
            f.lastModified = file.lastModified
            f.name = file.name
            f.path = file.path
            f.pathTo = document.getElementById('getFile').files[0].path + '/' + file.name
            f.readableSize = filesize(file.size)
            f.size = file.size
            f.status = 'Pending'
            f.timeAdded = Date.now() * 1
            f.type = file.type
            f.id = f.timeAdded + "::" + f.path
            ipcRenderer.send('async-compress-file', f)
            $scope.filesToCompress.push(f)
            $scope.filesToCompress = $scope.filesToCompress.slice(-100)
            ipcRenderer.send('resize-window')
        })
    }

    // result handling
    handleError = (error) => {
        console.error(error)
        if (typeof error.message !== 'undefined') {
            toastr.error('Something went wrong: ' + error.message, 'Error')
        } else {
            toastr.error('Something went wrong: ' + error, 'Error')
        }
    }

    $scope.loadSettings = () => {
        ipcRenderer.send('async-load-settings')
    }

    // init
    let init = () => {
        $scope.loadSettings()
    }

    init()
})

