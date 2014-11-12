Simple Todos with Meteor and Semantic UI
===============================

Simple Todos starter app using Meteor framework. Extends simple-todos tutorial to use Semantic UI.

# Setup instructions

Install meteor framework. All commands use terminal.

```
curl https://install.meteor.com/ | sh
```

Clone this repository.

Add Semantic UI package.

```
meteor add nooitaf:semantic-ui
```

Add accounts-ui package for authentication.

```
meteor add accounts-ui accounts-password
```

Make app secure

```
meteor remove insecure
```

Add publish-subscribe.

```
meteor remove autopublish
```

