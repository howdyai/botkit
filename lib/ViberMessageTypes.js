module.exports = ViberMessageTypes = {
    TextMessage: TextMessage,
    PictureMessage: PictureMessage,
    VideoMessage: VideoMessage,
    FileMessage: FileMessage,
    ContactMessage: ContactMessage,
    LocationMessage: LocationMessage,
    UrlMessage: UrlMessage,
    StickerMessage: StickerMessage,
    RichMediaMessage: RichMediaMessage
};

function TextMessage(text) {
    return {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'text',
        'text': text
    };
}

function PictureMessage(description, mediaUrl, thumbnailUrl) {
    let message = {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'picture',
        'text': description,
        'media': mediaUrl,
    };

    if (thumbnailUrl) { message[thumbnail] = thumbnailUrl; };

    return message;
}

function VideoMessage(mediaUrl, size, duration, thumbnail) {
    let message = {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'video',
        'media': mediaUrl,
        'size': size,
    };

    if (thumbnailUrl) { message[thumbnail] = thumbnailUrl; };
    if (duration) { message[duration] = duration; };

    return message;
}

function FileMessage(media, size, duration, file_name) {
    return {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'file',
        'media': media,
        'size': size,
        'file_name': file_name,
        'duration': duration
    };
}

function ContactMessage(name, phone_number) {
    return {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'contact',
        'contact': {
            'name': name,
            'phone_number': phone_number
        }
    };
}

function LocationMessage(lat, lng) {
    return {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'location',
        'location': {
            'lat': lat,
            'lon': lng
        }
    };
}

function UrlMessage(mediaUrl) {
    return {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'url',
        'media': mediaUrl
    };
}

function StickerMessage(stickerId) {
    return {
        'receiver': '',
        'min_api_version': 1,
        'sender': {
            'name': '',
            'avatar': ''
        },
        'tracking_data': 'tracking data',
        'type': 'sticker',
        'sticker_id': stickerId
    };
}

function RichMediaMessage(buttons) {
    return {
        'receiver': '',
        'type': 'rich_media',
        'min_api_version': 2,
        'rich_media': {
            'Type': 'rich_media',
            'ButtonsGroupColumns': 6,
            'ButtonsGroupRows': 7,
            'BgColor': '#FFFFFF',
            'Buttons': buttons
        }
    };
}
