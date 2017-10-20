var Alexa = require('alexa-sdk')

const things = {shoes: "chews", shirt: "chirt"}
const appId  = 'amzn1.ask.skill.4c11ab40-6a20-43f8-bbcc-5e587a65c989'

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context)

// note: this works fine in prod, but fails from AWS Service Simulator
    if (event.session.application.applicationId !== appId) {
        console.log('error will robinson')
        console.log(event.session)
    }

    alexa.appid = appId
    alexa.registerHandlers(handlers)
    alexa.execute()
}

const handlers = {
    'LaunchRequest': function () {
        this.emit('WhatsUp');
    },
    'WhatsUp': function () {
        this.emit(':ask', 'not much here. sup with you?', 'leave me alone.');
    },
    'YouUp': function () {
        let answer = `<emphasis level="reduced">
                        <prosody volume="x-soft">
                          <prosody rate="x-slow">yah,</prosody>
                          <break time="400ms"/>
                          <prosody rate="x-slow"><prosody pitch="+10%" rate="50%">I'm</prosody> up.</prosody>
                        </prosody>
                      </emphasis>
                      <amazon:effect name="whispered">You wanna come over?</amazon:effect>`
        this.emit(':ask', answer, 'you there?');  // the error handling is janky
    },
    'Yes': function() {
        this.emit(':tell', 'OK, cool.  Bring your dice; I lost my D20')
    },
    'No': function() {
        this.emit(':tell', 'what evs. later.')
    },
    'YouLikey': function() {
        let thing = this.event.request.intent.slots.myThingy.value
        let foundThing = things[thing.toLowerCase()]
        let answer = foundThing
                   ? ('ooh, yes, I like your ' + foundThing)
                   :  'meh'
        this.emit(':tell', answer)
    },
    'ZZZ_Default': function () {
        this.emit(':ask', "i'm confused");
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', 'K. bye.')
    }
};
