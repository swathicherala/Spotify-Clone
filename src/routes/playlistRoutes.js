const express = require('express')
const {
    createPlaylist,
    getPlaylists,
    getUserPlaylist,
    getUserPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    addCollaborator,
    removeCollaborator,
    getFeaturedPlaylists
} = require('../controllers/playlistController')
const upload = require('../middlewares/upload')
const {protect, isAdmin} = require('../middlewares/auth')

const playlistRouter = express.Router()

//Public routes
playlistRouter.get('/', getPlaylists)
playlistRouter.get('/featured',getFeaturedPlaylists)
playlistRouter.get('/:id',getUserPlaylistById)

//Private routes
playlistRouter.post('/',protect, upload.single('coverImage'), createPlaylist)
playlistRouter.get('/user/me',protect, getUserPlaylist)
playlistRouter.put('/:id',protect, upload.single('coverImage'), updatePlaylist)
playlistRouter.delete('/:id',protect, deletePlaylist)
playlistRouter.put('/:id/add-songs',protect, addSongToPlaylist)
playlistRouter.put('/:id/remove-songs/:songId',protect, removeSongFromPlaylist)
playlistRouter.put('/:id/add-collaborator',protect, addCollaborator)
playlistRouter.put('/:id/remove-collaborator',protect, removeCollaborator)

module.exports = playlistRouter