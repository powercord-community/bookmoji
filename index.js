const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { waitFor, getOwnerInstance } = require('powercord/util');
const { React } = require('powercord/webpack');
const { resolve } = require('path');
const Settings = require('./Settings');

module.exports = class Bookmoji extends Plugin {
  async startPlugin () {
    this.registerSettings(
      'bookmoji',
      'Bookmoji',
      () =>
        React.createElement(Settings, {
          settings: this.settings
        })
    );

    this.loadCSS(resolve(__dirname, 'style.scss'));

    const injection = (self, args, res) => {
      /* Kinda hacky but gets the job done */
      if (!args[0] && res.filter(cat => cat.category === 'bookmarked').length === 0) {
        const emojis = this.settings.get('storedEmojis').filter(a => a.constructor === Object);
        if (emojis.length) {
          const offsetBy = 32;
          let total = 0,
            index = 0,
            row = 0,
            column = 0;
          let offsetTop = offsetBy * Math.round(emojis.length / 10);

          const finalArray = [];
          let targetArray = [];
          for (const emoji of emojis) {
            targetArray.push({
              emoji,
              offsetTop,
              row,
              column
            });

            column++;
            index++;
            total++;

            if (index >= 10 || total >= emojis.length) {
              index = 0;
              finalArray.push({
                category: 'bookmarked',
                items: targetArray
              });

              targetArray = [];
              column = 0;
              row += 1;
              offsetTop += offsetBy;
            }
          }

          for (const cat of res) {
            for (const emojiContainer of cat.items) {
              emojiContainer.offsetTop += offsetBy;
              emojiContainer.row += row;
            }
          }

          for (const category of self.categories) {
            category.offsetTop += offsetBy * Math.round(emojis.length / 10);
            self.categoryOffsets[category.category] += offsetBy * Math.round(emojis.length / 10);
          }

          self.categoryOffsets.bookmarked = 0;
          self.categories.unshift({
            category: 'bookmarked',
            offsetTop: 0,
            title: '🔖 Bookmarked'
          });

          res = [ ...finalArray, ...res ];
          self.cachedMetaDataNoSearch = res;

          /* Make sure it shows up on the first pop-out */
          if (self.state) {
            self.state.metaData = res;
          }
        }
      }

      return res;
    };

    if (!document.querySelector('.pc-emojiPicker')) {
      await waitFor('.pc-emojiPicker');
    }

    const updateInstance = () =>
      (this.instance = getOwnerInstance(document.querySelector('.pc-emojiPicker')));
    const instancePrototype = Object.getPrototypeOf(updateInstance());
    updateInstance();

    inject('bookmoji-emojiPicker', instancePrototype, 'computeMetaData', function (args, res) {
      return injection(this, args, res);
    });

    injection(this.instance, [ null ], this.instance.state.metaData);
  }

  pluginWillUnload () {
    uninject('bookmoji-emojiPicker');
  }
};
