require("mocha");
const { expect } = require("chai");
const ExceptionUtilsIos = require("../walta-app/app/lib/ios/util/ExceptionUtils");
const ExceptionUtilsAndroid = require("../walta-app/app/lib/android/util/ExceptionUtils");
describe('ExceptionUtils - IOS', function() {
    it('should parse a stack frame', function() {
        const testFrame = `require@[native code]\nfile:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js:13057:10
loadAsync@file:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js:12985:13`;
        const result = ExceptionUtilsIos.parseStackTrace(testFrame);
        expect( result ).to.be.an('array');
        expect( result ).to.have.lengthOf(3);
        expect( result ).to.deep.equals([
            {
                symbol: "require",
                file: "[native code]"
            },
            {
                symbol: undefined,
                file: "file:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js",
                line: 13057,
                column: 10
            }, 
            {
                symbol: "loadAsync",
                file: "file:///var/containers/Bundle/Application/2D13F357-8F8B-4797-93AB-8A1C6E4178D9/Waterbug.app/ti.main.js",
                line: 12985,
                column: 13
            }
        ]);
    });
});

describe.only('ExceptionUtils - Android', function() {
    it('should parse a stack frame', function() {
        const testFrame = `TypeError: Cannot read property 'nonexistant_method' of null
     at stackFrame2 (/alloy/controllers/Main.js:285:10)
     at stackFrame1 (/alloy/controllers/Main.js:290:7)
     at Object.<anonymous> (/alloy/controllers/Main.js:292:44)
     at Object.trigger (/alloy/backbone.js:163:27)
     at Object.fireTopicEvent (/ui/Topics.js:93:18)
     at View.aboutClick (/alloy/controllers/Menu.js:362:12)
     at View.value (ti:/events.js:50:21)
     at View.value (ti:/events.js:102:19)`;
        const result = ExceptionUtilsAndroid.parseStackTrace(testFrame);
        expect( result ).to.be.an('array');
        expect( result ).to.have.lengthOf(8);
        expect( result ).to.deep.equals([
            {
                symbol: "stackFrame2",
                file: "/alloy/controllers/Main.js",
                line: 285,
                column: 10
            },
            {
                symbol: "stackFrame1",
                file: "/alloy/controllers/Main.js",
                line: 290,
                column: 7
            },
            {
                symbol: "Object.<anonymous>",
                file: "/alloy/controllers/Main.js",
                line: 292,
                column: 44
            },
            {
                symbol: "Object.trigger",
                file: "/alloy/backbone.js",
                line: 163,
                column: 27
            },
            {
                symbol: "Object.fireTopicEvent",
                file: "/ui/Topics.js",
                line: 93,
                column: 18
            },
            {
                symbol: "View.aboutClick",
                file: "/alloy/controllers/Menu.js",
                line: 362,
                column: 12
            },
            {
                symbol: "View.value",
                file: "ti:/events.js",
                line: 50,
                column: 21
            },
            {
                symbol: "View.value",
                file: "ti:/events.js",
                line: 102,
                column: 19
            }
        ]);
    });
});