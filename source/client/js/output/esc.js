import * as output from "./index";
import { COLOR_8BIT } from "./const";
import * as server from "../server";

let cursorHome,
    savedCursorPosition = [],
    savedGraphicProperties = {};

/**
 * DO NOT use output.print function inside: it may bring unexpected result as print function uses
 * stack.
 */
export default {
    "\u000C": () => {
        output.clear();
    },
    "\n": () => {
        output.scrollDisplay(1);
    },
    "\r": () => {
        output.setCursorX(1);
    },
    // tab control
    "\t": () => {
        let x = output.getCursorX(),
            tabs = output.getTabs();
        for (let i = 0; i < tabs.length; i++) {
            if (x < tabs[i]) {
                output.setCursorX(tabs[i]);
                return;
            }
        }
    },
    "\x1bH": () => {
        output.setTabAt(output.getCursorX());
    },
    "\x1b[g": () => {
        output.clearTab(output.getCursorX());
    },
    "\x1b[3g": () => {
        output.clearTab();
    },
    // scrolling
    "\x1b[r": () => {
        output.disableScrolling();
    },
    "\x1b[{\\d*}{;?}{\\d*}r": (args) => {
        let start = args[0] || 1,
            end = args[2] || output.HEIGHT;
        if (!args[1])
            start = args[0] || args[2];
        if (!start) {
            output.disableScrolling();
            return;
        }
        output.enableScrolling(start, end);
    },
    "\x1bD": () => {
        output.scrollDisplay(1);
    },
    "\x1bM": () => {
        output.scrollDisplay(-1);
    },
    // status
    "\x1b[c": () => {
        server.send(`i`, `\x1b10c`);
    },
    "\x1b[5n": () => {
        server.send(`i`, `\x1b0n`);
    },
    "\x1b[6n": () => {
        server.send(`i`, `\x1b[${ output.getCursorY() };${ output.getCursorY() }n`);
    },
    "\x1bc": () => {
        // Reset terminal settings to default. Caché TERM does not reset settings, indeed.
        output.LINE_WRAP_ENABLED = true;
    },
    "\x1b[7h": () => {
        output.LINE_WRAP_ENABLED = true;
    },
    "\x1b[7l": () => {
        output.LINE_WRAP_ENABLED = false;
    },
    // font control
    "\x1b(": () => {
        // set default font
    },
    "\x1b)": () => {
        // set alternate font
    },
    // printing
    "\x1b[{\\d*}i": () => {
        window.print();
    },
    // cursor control
    "\x1b[{\\d*}{;?}{\\d*}H": cursorHome = (args) => {
        if (args[0] || args[2]) {
            if (args[0])
                output.setCursorY(+args[0]);
            if (args[2])
                output.setCursorX(+args[2]);
        } else {
            output.setCursorX(1);
            output.setCursorY(1);
        }
    },
    "\x1b[{\\d*}{;?}{\\d*}f": cursorHome,
    "\x1b[{\\d*}A": (args) => {
        output.setCursorY(Math.max(1, output.getCursorY() - (+args[0] || 1)));
    },
    "\x1b[{\\d*}B": (args) => {
        output.setCursorY(Math.min(output.HEIGHT, output.getCursorY() + (+args[0] || 1)));
    },
    "\x1b[{\\d*}C": (args) => {
        output.setCursorX(Math.min(output.WIDTH, output.getCursorX() + (+args[0] || 1)));
    },
    "\x1b[{\\d*}D": (args) => {
        output.setCursorX(Math.max(1, output.getCursorX() - (+args[0] || 1)));
    },
    "\x1b[{\\d*}G": (args) => {
        output.setCursorX(+args[0]);
    },
    "\x1b[s": () => {
        savedCursorPosition = [output.getCursorX(), output.getCursorY()];
    },
    "\x1b[u": () => {
        if (!savedCursorPosition.length)
            return;
        output.setCursorX(savedCursorPosition[0]);
        output.setCursorY(savedCursorPosition[1]);
    },
    "\x1b7": () => {
        savedCursorPosition = [output.getCursorX(), output.getCursorY()];
        savedGraphicProperties = JSON.parse(JSON.stringify(output.GRAPHIC_PROPERTIES));
    },
    "\x1b8": () => {
        if (!savedCursorPosition.length)
            return;
        output.setCursorX(savedCursorPosition[0]);
        output.setCursorY(savedCursorPosition[1]);
        output.GRAPHIC_PROPERTIES = JSON.parse(JSON.stringify(savedGraphicProperties));
    },
    // erasing text
    "\x1b[K": () => {
        let pos = output.getCursorX(),
            gp = output.GRAPHIC_PROPERTIES;
        output.resetGraphicProperties();
        output.getCurrentLine().print(new Array(output.WIDTH - pos + 2).join(" "), pos - 1);
        output.GRAPHIC_PROPERTIES = gp;
    },
    "\x1b[1K": () => {
        let pos = output.getCursorX(),
            gp = output.GRAPHIC_PROPERTIES;
        output.resetGraphicProperties();
        output.getCurrentLine().print(new Array(pos + 1).join(" "), 0);
        output.GRAPHIC_PROPERTIES = gp;
    },
    "\x1b[2K": () => {
        output.getCurrentLine().clear();
    },
    "\x1b[J": () => {
        let y = output.getCursorY();
        for (; y < output.HEIGHT + 1; y++) {
            output.getLineByCursorY(y).clear();
        }
    },
    "\x1b[1J": () => {
        let y = output.getCursorY();
        for (; y > 0; y--) {
            output.getLineByCursorY(y).clear();
        }
    },
    "\x1b[2J": () => {
        for (let y = 1; y < output.HEIGHT + 1; y++) {
            output.getLineByCursorY(y).clear();
        }
        output.setCursorX(1); // Caché TERM does not set cursor to it's home position.
        output.setCursorY(1); // But standard requires this.
    },
    //
    "\x1b[{\\d*};\"{[^\"]}\"p": (args) => { // define key
        console.log("\\key!", args); // todo
    },
    "\x1b[{\\d+(?:;\\d+)*}m": (args) => {
        let indices = args[0].split(`;`);
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] === "0") {
                output.resetGraphicProperties();
                continue;
            }
            if (indices[i] === "22") {
                output.clearGraphicProperty(1);
                output.clearGraphicProperty(2);
                continue;
            }
            if ((indices[i] === "38" || indices[i] === "48") && indices[i + 1] === "5") {
                output.setGraphicProperty(+indices[i], {
                    class: `m${indices[i]}`,
                    style: `${indices[i] === "48" ? "background-" : ""}color:${ COLOR_8BIT[indices[i + 2]] }`
                });
                i += 2;
                continue;
            }
            output.setGraphicProperty(indices[i], {
                class: `m${indices[i]}`
            });
        }
    },
    "\x1b[({[\\w\\-]+})m": (args) => { // print element of class
        let cls = args[0];
        if (!cls)
            return;
        output.setGraphicProperty(9, { class: cls });
    },
    "\x1b!URL={[^\\x20]*} ({[^\\)]+})": ([url, text]) => {
        output.setGraphicProperty(9, {
            tag: "a",
            attrs: {
                href: url,
                target: "_blank"
            }
        });
        output.immediatePlainPrint(text);
        output.clearGraphicProperty(9);
    }
}