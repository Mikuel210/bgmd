# bgmd - The background music daemon

bgmd is a music daemon that constantly matches music to your current mood. My goal is to make the coolest music system ever to feel like you're living in a movie. It covers music discovery, capture, download, playing and mood matching.

## Features

- **Capture:** Easily add songs, albums or entire artists to your library from their name
- **Download:** Easily download your library with a single command
- **Playback:** Use it as a normal music player with every feature you would expect
- **Mood-matching:** Set a current mood vector and the daemon constantly matches music to it

## Prerequisites

- yt-dlp
- mpv

## Usage

Manage playback:
- bgmctl status
- bgmctl play
- bgmctl pause TODO
- bgmctl resume TODO
- bgmctl stop

Manage library:
- bgmctl pull
- bgmctl song <list|add|show|edit|remove>
- bgmctl album <list|show|edit|remove>
- bgmctl artist <list|show|edit|remove>
- bgmctl capture <song|album|artist>

Manage mood: TODO
- bgmctl mood show
- bgmctl mood set
- bgmctl mood unset
- bgmctl mood clear
