fx_version 'cerulean'
game 'gta5'
lua54 'yes'
node_version '22'

description 'Noverna PostgreSQL Database Wrapper'
version '1.0.0'
author 'Noverna'


server_scripts {
    'typescript/dist/index.js'
}

files {
    'lib/postgres.lua'
}

dependencies {
    '/server:5848', -- Minimal FXServer version
}
