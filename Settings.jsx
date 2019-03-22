const { React } = require('powercord/webpack');
const { getModule } = require('powercord/webpack');
const { Category } = require('powercord/components/settings');
const { getSortedGuilds } = getModule([ 'getSortedGuilds' ]);
const emojiStore = getModule([ 'getGuildEmoji' ]);

module.exports = class Settings extends React.Component {
  constructor (props) {
    super(props);

    const get = props.settings.get.bind(props.settings);

    this.state = {
      storedEmojis: get('storedEmojis', [])
    };
  }

  render () {
    return (
      <div>
        <Category
          name='Bookmarked Emojis'
          description={'You can select which emojis you want to appear in the \'Bookmarked\' section of the emoji picker.'}
          opened={this.state.categoryOpened}
          onChange={() => this.setState({ categoryOpened: !this.state.categoryOpened })}
        >
          {getSortedGuilds().map(g => g.guild).map(g =>
            <Category
              name={g.name}
              opened={this.state[`${g.id}-opened`]}
              onChange={() => this.setState({ [`${g.id}-opened`]: !this.state[`${g.id}-opened`] })}
            >
              {Object.values(emojiStore.getGuilds()).flatMap(r => r.emojis).filter(a => a.guildId === g.id).map(em =>
                <button type="button" class={`bookmoji-emoji-container pc-grow pc-button ${this.state.storedEmojis.find(a => a.id === em.id) ? 'bookmoji-emoji-selected' : ''}`} onClick={(e) => {
                  const target = ![ ...e.target.classList ].includes('bookmoji-emoji-container') ? e.target.parentNode : e.target;

                  if (![ ...target.classList ].includes('bookmoji-emoji-selected')) {
                    target.classList.add('bookmoji-emoji-selected');
                    this.state.storedEmojis.push(em);
                    this._set('storedEmojis', this.state.storedEmojis);
                  } else {
                    target.classList.remove('bookmoji-emoji-selected');
                    this._set('storedEmojis', this.state.storedEmojis.filter(a => a.id !== em.id));
                  }
                } }>
                  <img class='bookmoji-emoji' src={em.url}></img>
                </button>
              )}
            </Category>
          )}
        </Category>
      </div>
    );
  }

  _set (key, value = !this.state[key], defaultValue) {
    if (!value && defaultValue) {
      value = defaultValue;
    }

    this.props.settings.set(key, value);
    this.setState({ [key]: value });
  }
};
