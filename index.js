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

    const injection = (self, res) => {
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
            column,
            available: true
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

        for (const category of self.state.metaData) {
          for (const emojiContainer of category.items) {
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

        self.cachedMetaDataNoSearch = [ ...finalArray, ...self.state.metaData ];

        self.setState({
          metaData: self.cachedMetaDataNoSearch
        });

        return res;
      }
    };

    if (!document.querySelector('.pc-emojiPicker')) {
      await waitFor('.pc-emojiPicker');
    }

    const updateInstance = () =>
      (this.instance = getOwnerInstance(document.querySelector('.pc-emojiPicker')));
    const instancePrototype = Object.getPrototypeOf(updateInstance());
    updateInstance();

    inject('bookmoji-emojiPicker', instancePrototype, 'componentDidMount', function (args, res) {
      return injection(this, res);
    });

    this.instance.componentDidMount();
  }

  pluginWillUnload () {
    uninject('bookmoji-emojiPicker');
  }
};
