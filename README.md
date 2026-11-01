# bgmd - The background music daemon

bgmd is an all-in-one music solution. It covers music discovery, capture, download and playback. My end goal is to create a music daemon that constantly matches music to your current mood; the coolest music system ever to feel like you're living in a movie.

## Features

- **Capture:** Easily add songs, albums or entire artists to your library from their name
- **Download:** Easily download your library with a single command
- **Playback:** Use it as a normal music player with every feature you would expect

## Prerequisites

- yt-dlp
- mpv

## Usage

Manage playback:

- bgmctl status
- bgmctl play
- bgmctl skip
- bgmctl pause
- bgmctl resume
- bgmctl stop

Manage library:

- bgmctl pull
- bgmctl song <list|add|capture|show|edit|remove>
- bgmctl album <list|capture|show|edit|remove>
- bgmctl artist <list|capture|show|edit|remove>
