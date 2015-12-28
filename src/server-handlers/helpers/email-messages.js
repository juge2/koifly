'use strict';


var EmailMessages = {
    PASSWORD_CHANGE: {
        from: 'noreply@koifly.com',
        subject: 'Your Koifly password was changed',
        text: [
            'Your Koifly password was changed.',
            'If it was not you follow the link to reset your password:',
            '%s',
            'Fly safe!'
        ].join('\n'),

        html: [
            '<p><b>Your Koifly password was changed</b></p>',
            '<p>If it was not you follow the link to reset your password:</p>',
            '<p><a href="%s">%s</a></p><br/>',
            '<p>Fly safe!</p>'
        ].join('\n')
    },

    EMAIL_VERIFICATION: {
        from: 'noreply@koifly.com',
        subject: 'Koifly registration',
        text: [
            'You successfully signed in to Koifly application.',
            'To complete your registration and confirm your email follow the link:',
            '%s',
            'Fly safe!'
        ].join('\n'),

        html: [
            '<p><b>You successfully signed in to Koifly application</b></p>',
            '<p>To complete your registration and confirm your email follow the link:</p>',
            '<p><a href="%s">%s</a></p><br/>',
            '<p>Fly safe!</p>'
        ].join('\n')
    },

    PASSWORD_RESET: {
        from: 'noreply@koifly.com',
        subject: 'Koifly password reset',
        text: [
            'You requested for Koifly password reset.',
            'Follow the link and fill in the form:',
            '%s',
            'Fly safe!'
        ].join('\n'),

        html: [
            '<p><b>You requested for Koifly password reset</b></p>',
            '<p>Follow the link and fill in the form:</p>',
            '<p><a href="%s">%s</a></p><br/>',
            '<p>Fly safe!</p>'
        ].join('\n')
    },

    ONE_TIME_LOGIN: {
        from: 'noreply@koifly.com',
        subject: 'Log in to Koifly with your email',
        text: [
            'You do not need to have your password handy any more.',
            'Log in to your Koifly account by clicking on the link:',
            '%s',
            'Fly safe!'
        ].join('\n'),

        html: [
            '<p><b>You do not need to have your password handy any more</b></p>',
            '<p>Log in to your Koifly account by clicking on the link:</p>',
            '<p><a href="%s">%s</a></p><br/>',
            '<p>Fly safe!</p>'
        ].join('\n')
    }
};


module.exports = EmailMessages;
