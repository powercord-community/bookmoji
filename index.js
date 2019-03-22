const Plugin = require('powercord/Plugin');
const { inject, uninject } = require('powercord/injector');
const { waitFor, getOwnerInstance } = require('powercord/util');
const { React } = require('powercord/webpack');
const { resolve } = require('path');
const Settings = require('./Settings');

module.exports = class Bookmoji extends Plugin {
  async start () {
    powercord
      .pluginManager
      .get('pc-settings')
      .register(
        'bookmoji',
        'Bookmoji',
        () =>
          React.createElement(Settings, {
            settings: this.settings
          })
      );

    this.loadCSS(resolve(__dirname, 'style.scss'));

    const injection = (props, res) => {
      console.log(props);
      const emojis = this.settings.get('storedEmojis').filter(a => a.constructor === Object);
      if (emojis.length) {
        const offsetBy = 32;
        let total = 0;
        let index = 0;
        let offsetTop = offsetBy * 2;
        let row = 0;
        let column = 0;

        const finalArray = [];
        let targetArray = [];
        for (const emoji of emojis) {
          targetArray.push({ emoji,
            offsetTop,
            row,
            column });
          column++;

          if (index > 9 || total >= emojis.length - 1) {
            index = 0;
            finalArray.push({ category: 'bookmarked',
              items: targetArray });

            targetArray = [];
            column = 0;
            row += 1;
            offsetTop += offsetBy;
          }

          index++;
          total++;
        }

        for (const cat of props.state.metaData) {
          for (const emojiContainer of cat.items) {
            emojiContainer.offsetTop += offsetBy;
          }
        }

        for (const category of props.categories) {
          category.offsetTop += offsetBy;
          props.categoryOffsets[category.category] += offsetBy;
        }

        props.categoryOffsets.bookmarked = 0;
        props.categories.unshift({ category: 'bookmarked',
          offsetTop: 0,
          title: '🔖 Bookmarked' });

        props.setState({
          metaData: [ ...finalArray, ...props.state.metaData ]
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
    injection(instancePrototype.componentDidMount());
  }

  unload () {
    uninject('bookmoji-emojiPicker');
  }
};
