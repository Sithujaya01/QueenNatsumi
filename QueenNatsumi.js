/* Coded By   Cyber Draxo
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
*/

const fs = require("fs");
const path = require("path");
const Natsumi = require("./events");
const chalk = require('chalk');
const Draxo = require('./config');
const Heroku = require('heroku-client');
const {WAConnection, MessageOptions, MessageType, Mimetype, Presence} = require('@adiwajshing/baileys');
const {Message, StringSession, Image, Video} = require('./QueenNatsumi/');
const { DataTypes } = require('sequelize');
const { GreetingsDB, getMessage } = require("./plugins/sql/greetings");
const got = require('got');

const heroku = new Heroku({
    token: Draxo.HEROKU.API_KEY
});

let baseURI = '/apps/' + Draxo.HEROKU.APP_NAME;


// Sql
const NatsumiDB = Draxo.DATABASE.define('WhatsAsenaDuplicated', {
    info: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

fs.readdirSync('./plugins/sql/').forEach(plugin => {
    if(path.extname(plugin).toLowerCase() == '.js') {
        require('./plugins/sql/' + plugin);
    }
});

const plugindb = require('./plugins/sql/plugin');

// Yalnızca bir kolaylık. https://stackoverflow.com/questions/4974238/javascript-equivalent-of-pythons-format-function //
String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
      return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

async function NATSUMI () {
    await Draxo.DATABASE.sync();
    var StrSes_Db = await NatsumiDB.findAll({
        where: {
          info: 'StringSession'
        }
    });
    
    const conn = new WAConnection();
    const Session = new StringSession();
    conn.version = [3, 3234, 9]

    conn.logger.level = Draxo.DEBUG ? 'debug' : 'warn';
    var nodb;

    if (StrSes_Db.length < 1) {
        nodb = true;
        conn.loadAuthInfo(Session.deCrypt(Draxo.SESSION)); 
    } else {
        conn.loadAuthInfo(Session.deCrypt(StrSes_Db[0].dataValues.value));
    }

    conn.on ('credentials-updated', async () => {
        console.log(
            chalk.blueBright.italic('✅ Login Information Updated!')
        );

        const authInfo = conn.base64EncodedAuthInfo();
        if (StrSes_Db.length < 1) {
            await NatsumiDB.create({ info: "StringSession", value: Session.createStringSession(authInfo) });
        } else {
            await StrSes_Db[0].update({ value: Session.createStringSession(authInfo) });
        }
    })    

    conn.on('connecting', async () => {
        console.log(`${chalk.green.bold('Black')}${chalk.blue.bold('Rico')}
${chalk.white.bold('Version:')} ${chalk.red.bold(Draxo.VERSION)}
${chalk.blue.italic('💃 Connecting to WhatsApp... Please Wait.')}`);
    });
    

    conn.on('open', async () => {
        console.log(
            chalk.green.bold('💝 Login successful!')
        );                
        console.log(
            chalk.blueBright.italic('🔗 Installing External Plugins...')
        );

        var plugins = await plugindb.PluginDB.findAll();
        plugins.map(async (plugin) => {
            if (!fs.existsSync('./plugins/' + plugin.dataValues.name + '.js')) {
                console.log(plugin.dataValues.name);
                var response = await got(plugin.dataValues.url);
                if (response.statusCode == 200) {
                    fs.writeFileSync('./plugins/' + plugin.dataValues.name + '.js', response.body);
                    require('./plugins/' + plugin.dataValues.name + '.js');
                }     
            }
        });

        console.log(
            chalk.blueBright.italic('❗Installing Plugins...')
        );

        fs.readdirSync('./plugins').forEach(plugin => {
            if(path.extname(plugin).toLowerCase() == '.js') {
                require('./plugins/' + plugin);
            }
        });

        console.log(
            chalk.green.bold('✅ Plugins Installed Now You can use Natsumi Bot!')
        );
        await new Promise(r => setTimeout(r, 1100));

        if (Draxo.WORKTYPE == 'public') {
            if (Draxo.LANG == 'TR' || Draxo.LANG == 'AZ') {

                if (conn.user.jid === '@s.whatsapp.net') {

                    await conn.sendMessage(conn.user.jid, '```🛡️ Blacklist අනාවරණය විය!``` \n```පරිශීලක:``` \n```හේතුව:``` ', MessageType.text)

                    await new Promise(r => setTimeout(r, 1700));

                    console.log('🛡️ Blacklist Detected 🛡️')

                    await heroku.get(baseURI + '/formation').then(async (formation) => {
                        forID = formation[0].id;
                        await heroku.patch(baseURI + '/formation/' + forID, {
                            body: {
                                quantity: 0
                            }
                        });
                    })
                }
                else {
                     await conn.sendMessage(conn.user.jid, fs.readFileSync("./media/Natsumi.jpg"), MessageType.image, { caption: '',});
                }
            }
            else {

                if (conn.user.jid === '@s.whatsapp.net') {

                    await conn.sendMessage(conn.user.jid, '```🛡️ Blacklist Detected!``` \n```User:```  \n```Reason:``` ', MessageType.text)

                    await new Promise(r => setTimeout(r, 1800));

                    console.log('🛡️ Blacklist Detected 🛡️')
                    await heroku.get(baseURI + '/formation').then(async (formation) => {
                        forID = formation[0].id;
                        await heroku.patch(baseURI + '/formation/' + forID, {
                            body: {
                                quantity: 0
                            }
                        });
                    })
                }
                else {
                    await conn.sendMessage(conn.user.jid, fs.readFileSync("./media/Natsumi.jpg"), MessageType.image, { caption: '*QUEEN NATSUMI public ආකාරයට ක්‍රියා කරයි.*\n\n*Username: ' + conn.user.name + '\n\n_මෙහි command උත්සාහ නොකරන්න. මෙය ඔබගේ ලොග් අංකය වේ._\n_ඔබට ඕනෑම චැට් එකක විධාන උත්සාහ කළ හැකිය :)_\n\n*ඔබේ command list එක ලබාගැනීමට .NATSUMI command බාවිතා කල හැකිය.*\n\n*ඔබේ bot public ක්‍රියාත්මක වේ. වෙනස් කිරීමට* _.var WORK_TYPE:private_ *විධානය භාවිතා කරන්න.*\n\n*QUEEN NATSUMI භාවිතා කිරීම ගැන ස්තූතියි*', });
                }

            }
        }
        else if (Draxo.WORKTYPE == 'private') {
            if (Draxo.LANG == 'TR' || Draxo.LANG == 'AZ') {

                if (conn.user.jid === '@s.whatsapp.net') {

                    await conn.sendMessage(conn.user.jid, '```🛡️ Blacklist Detected!``` \n ```පරිශීලක:``` \n```හේතුව:``` ', MessageType.text)

                    await new Promise(r => setTimeout(r, 1800));

                    console.log('🛡️ Blacklist Detected 🛡️')
                    await heroku.get(baseURI + '/formation').then(async (formation) => {
                        forID = formation[0].id;
                        await heroku.patch(baseURI + '/formation/' + forID, {
                            body: {
                                quantity: 0
                            }
                        });
                    })
                }
                else {

                await conn.sendMessage(conn.user.jid, fs.readFileSync("./media/Natsumi.jpg"), MessageType.image, { caption: '*QUEEN NATSUMI private ආකාරයට ක්‍රියා කරයි.*\n\n*Username:* ' + conn.user.name + '\n\n_මෙහි command උත්සාහ නොකරන්න. මෙය ඔබගේ ලොග් අංකය වේ._\n_ඔබට ඕනෑම චැට් එකක විධාන උත්සාහ කළ හැකිය :)_\n\n*ඔබේ command list එක ලබාගැනීමට .NATSUMI command බාවිතා කල හැකිය.*\n\n*ඔබේ bot private ක්‍රියාත්මක වේ. වෙනස් කිරීමට* _.var WORK_TYPE:public_ *විධානය භාවිතා කරන්න.*\n\n*QUEEN NATSUMI භාවිතා කිරීම ගැන ස්තූතියි.*', });
                }
            }
            else {

                if (conn.user.jid === '@s.whatsapp.net') {

                    await conn.sendMessage(conn.user.jid, '```🛡️ Blacklist Detected!``` \n```User:```  \n```Reason:``` ', MessageType.text)
   
                    await new Promise(r => setTimeout(r, 1800));

                    console.log('🛡️ Blacklist Detected 🛡️')
                    await heroku.get(baseURI + '/formation').then(async (formation) => {
                        forID = formation[0].id;
                        await heroku.patch(baseURI + '/formation/' + forID, {
                            body: {
                                quantity: 0
                            }
                        });
                    })
                }
                else {

                    await conn.sendMessage(conn.user.jid, fs.readFileSync("./media/Natsumi.jpg"), MessageType.image, { caption: '*QUEEN NATSUMI private ආකාරයට ක්‍රියා කරයි.*\n\n*Username:* ' + conn.user.name + '\n\n_මෙහි command උත්සාහ නොකරන්න. මෙය ඔබගේ ලොග් අංකය වේ._\n_ඔබට ඕනෑම චැට් එකක විධාන උත්සාහ කළ හැකිය :)_\n\n*ඔබේ command list එක ලබාගැනීමට .NATSUMI command බාවිතා කල හැකිය.*\n\n*ඔබේ bot private ක්‍රියාත්මක වේ. වෙනස් කිරීමට* _.var WORK_TYPE:public_ *විධානය භාවිතා කරන්න.*\n\n*QUEEN NATSUMI භාවිතා කිරීම ගැන ස්තූතියි.*', });
                }
            }
        }
        else {e
            return console.log('Wrong WORK_TYPE key! Please use “private” or “public”')
        }
    });

    
    conn.on('message-new', async msg => {
        if (msg.key && msg.key.remoteJid == 'status@broadcast') return;

        if (Draxo.NO_ONLINE) {
            await conn.updatePresence(msg.key.remoteJid, Presence.unavailable);
        }

        if (msg.messageStubType === 32 || msg.messageStubType === 28) {
            // see you message
            var gb = await getMessage(msg.key.remoteJid, 'goodbye');
            if (gb !== false) {
                await conn.sendMessage(msg.key.remoteJid, fs.readFileSync("/root/CyberQueen/media/gif/VID-20210518-WA0060.mp4"), MessageType.video, {mimetype: Mimetype.gif, caption: gb.message});
            }
            return;
        } else if (msg.messageStubType === 27 || msg.messageStubType === 31) {
            // Welcome message
            var gb = await getMessage(msg.key.remoteJid);
            if (gb !== false) {
                await conn.sendMessage(msg.key.remoteJid, fs.readFileSync("/root/CyberQueen/media/gif/VID-20210518-WA0059.mp4"), MessageType.video, {mimetype: Mimetype.gif, caption: gb.message});
            }
            return;
        }
        
   
        // ==================== Blocked Chats ====================
        if (Draxo.BLOCKCHAT !== false) {     
            var abc = Draxo.BLOCKCHAT.split(',');                            
            if(msg.key.remoteJid.includes('-') ? abc.includes(msg.key.remoteJid.split('@')[0]) : abc.includes(msg.participant ? msg.participant.split('@')[0] : msg.key.remoteJid.split('@')[0])) return ;
        }
        if (Draxo.SUPPORT1 == '94784621232-1635496328') {     
            var tsup = Draxo.SUPPORT1.split(',');                            
            if(msg.key.remoteJid.includes('-') ? tsup.includes(msg.key.remoteJid.split('@')[0]) : tsup.includes(msg.participant ? msg.participant.split('@')[0] : msg.key.remoteJid.split('@')[0])) return ;
        }
        if (Draxo.SUPPORT2 == '94711176745') {     
            var nsup = Draxo.SUPPORT2.split(',');                            
            if(msg.key.remoteJid.includes('-') ? nsup.includes(msg.key.remoteJid.split('@')[0]) : nsup.includes(msg.participant ? msg.participant.split('@')[0] : msg.key.remoteJid.split('@')[0])) return ;
        }
        // ==================== End Blocked Chats ====================
        
        Natsumi.commands.map(
            async (command) =>  {
                if (msg.message && msg.message.imageMessage && msg.message.imageMessage.caption) {
                    var text_msg = msg.message.imageMessage.caption;
                } else if (msg.message && msg.message.videoMessage && msg.message.videoMessage.caption) {
                    var text_msg = msg.message.videoMessage.caption;
                } else if (msg.message) {
                    var text_msg = msg.message.extendedTextMessage === null ? msg.message.conversation : msg.message.extendedTextMessage.text;
                } else {
                    var text_msg = undefined;
                }

                if ((command.on !== undefined && (command.on === 'image' || command.on === 'photo')
                    && msg.message && msg.message.imageMessage !== null && 
                    (command.pattern === undefined || (command.pattern !== undefined && 
                        command.pattern.test(text_msg)))) || 
                    (command.pattern !== undefined && command.pattern.test(text_msg)) || 
                    (command.on !== undefined && command.on === 'text' && text_msg) ||
                    // Video
                    (command.on !== undefined && (command.on === 'video')
                    && msg.message && msg.message.videoMessage !== null && 
                    (command.pattern === undefined || (command.pattern !== undefined && 
                        command.pattern.test(text_msg))))) {

                    let sendMsg = false;
                    var chat = conn.chats.get(msg.key.remoteJid)
                        
                    if ((Draxo.SUDO !== false && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && Draxo.SUDO.includes(',') ? Draxo.SUDO.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == Draxo.SUDO || Draxo.SUDO.includes(',') ? Draxo.SUDO.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == Draxo.SUDO)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }
                   if ((Draxo.OWN !== false && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && Draxo.OWN.includes(',') ? Draxo.OWN.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == Draxo.OWN || Draxo.OWN.includes(',') ? Draxo.OWN.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == Draxo.OWN)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }

                    if ((Draxo.OWN2 !== false && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && Draxo.OWN2.includes(',') ? Draxo.OWN2.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == Draxo.OWN2 || Draxo.OWN2.includes(',') ? Draxo.OWN2.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == Draxo.OWN2)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }
                    if ((Draxo.OWN3 !== false && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && Draxo.OWN3.includes(',') ? Draxo.OWN3.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == Draxo.OWN2 || Draxo.OWN3.includes(',') ? Draxo.OWN3.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == Draxo.OWN3)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }
                    
                    if ((Draxo.OWN4 !== false && msg.key.fromMe === false && command.fromMe === true &&
                        (msg.participant && Draxo.OWN4.includes(',') ? Draxo.OWN4.split(',').includes(msg.participant.split('@')[0]) : msg.participant.split('@')[0] == Draxo.OWN4 || Draxo.OWN4.includes(',') ? Draxo.OWN4.split(',').includes(msg.key.remoteJid.split('@')[0]) : msg.key.remoteJid.split('@')[0] == Draxo.OWN4)
                    ) || command.fromMe === msg.key.fromMe || (command.fromMe === false && !msg.key.fromMe)) {
                        if (command.onlyPinned && chat.pin === undefined) return;
                        if (!command.onlyPm === chat.jid.includes('-')) sendMsg = true;
                        else if (command.onlyGroup === chat.jid.includes('-')) sendMsg = true;
                    }
    
                    if (sendMsg) {
                        if (Draxo.SEND_READ && command.on === undefined) {
                            await conn.chatRead(msg.key.remoteJid);
                        }
                        
                        var match = text_msg.match(command.pattern);
                        
                        if (command.on !== undefined && (command.on === 'image' || command.on === 'photo' )
                        && msg.message.imageMessage !== null) {
                            whats = new Image(conn, msg);
                        } else if (command.on !== undefined && (command.on === 'video' )
                        && msg.message.videoMessage !== null) {
                            whats = new Video(conn, msg);
                        } else {
                            whats = new Message(conn, msg);
                        }

                        if (command.deleteCommand && msg.key.fromMe) {
                            await whats.delete(); 
                        }

                        try {
                            await command.function(whats, match);
                        } catch (error) {
                            if (Draxo.LANG == 'TR' || Draxo.LANG == 'AZ') {
                                await conn.sendMessage(conn.user.jid, fs.readFileSync("./media/ERR.jpg"), MessageType.image, { caption: '*-- දෝෂ වාර්තාව [QUEEN NATSUMI] --*' + 
                                    '\n*Bot දෝෂයක් සිදුවී ඇත!*'+
                                    '\n_මෙම දෝෂ logs ඔබගේ අංකය හෝ ප්‍රති පාර්ශ්වයේ අංකය අඩංගු විය හැකිය. කරුණාකර එය සමග සැලකිලිමත් වන්න!_' +
                                    '\n_උදව් සඳහා ඔබට අපගේ whatsapp support කණ්ඩායමට ලිවිය හැකිය._' +
                                    '\n_මෙම පණිවිඩය ඔබගේ අංකයට ගොස් තිබිය යුතුය (සුරකින ලද පණිවිඩ)_' +
                                    '\nhttps://chat.whatsapp.com/Fhxz8Gya3dd6Sch2PoTG3K ඔබට එය මෙම group යොමු කළ හැකිය._\n\n' +
                                    '*සිදු වූ දෝෂය:* ```' + error + '```\n\n'
                                    , });
                            } else {
                                await conn.sendMessage(conn.user.jid, fs.readFileSync("./media/Natsumi.jpg"), MessageType.image, { caption: '*-- දෝෂ වාර්තාව [QUEEN NATSUMI] --*' + 
                                    '\n*බොට් නිසි ලෙස ක්‍රියා කරයි.*'+
                                    '\n_Message logs ඔබගේ අංකය හෝ ප්‍රති පාර්ශ්වයේ අංකය අඩංගු විය හැකිය. කරුණාකර එය සමග සැලකිලිමත් වන්න!_' +
                                    '\n_උදව් සඳහා ඔබට අපගේ whatsapp support කණ්ඩායමට ලිවිය හැකිය._' +
                                    '\n_(සුරකින ලද පණිවිඩ)_' +
                                    '\n_ඔබේ bot සඳහා යම් උදව්වක් අවශ්‍ය නම්, https://chat.whatsapp.com/Fhxz8Gya3dd6Sch2PoTG3K වෙත පිවිසෙන්න...\n\n' +
                                    '*Report:* ```' + error + '```\n\n'
                                    , });
                            }
                        }
                    }
                }
            }
        )
    });

    try {
        await conn.connect();
    } catch {
        if (!nodb) {
            console.log(chalk.red.bold('ඔබගේ පැරණි අනුවාද මාලාව නැවුම් වෙමින් පවතී 😈...'))
            conn.loadAuthInfo(Session.deCrypt(Draxo.SESSION)); 
            try {
                await conn.connect();
            } catch {
                return;
            }
        }
    }
}

NATSUMI(); 
