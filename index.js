const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const reactDocGen = require('react-docgen');
const camelCased = require('lodash/camelCase');
const upperFirst = require('lodash/upperFirst');

const template = fs.readFileSync('./template.ejs', 'utf8');

const walkTheDirectory = (directoryToWalk, regex, callback) => {
    fs.readdirSync(directoryToWalk).forEach( fsElement => {
        let dirPath = path.join(directoryToWalk, fsElement);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkTheDirectory(dirPath, regex, callback)
            :
            fsElement.match(regex) !== null && callback(path.join(directoryToWalk, fsElement));
    });
};

const getValueForType = type => {
    switch (type) {
        case 'array':
        case 'arrayOf':
            return '[]';
        case 'bool':
            return 'false';
        case 'string':
            return `''`;
        case 'shape':
            return '{}';
        case 'func':
            return '() => null';
        default:
            return null;
    }
};

const createTest = (pathToFile) => {
    const testFilePath = path.join(pathToFile, '../', 'index.test.js');
    if (!fs.existsSync(testFilePath)) {
        const componentName = upperFirst(camelCased(path.dirname(pathToFile).split('/').pop()));
        const componentContent = fs.readFileSync(pathToFile, 'utf8');
        let defaultProps = {};
        try {
            const parsedProps = reactDocGen.parse(componentContent).props;
            Object.keys(parsedProps)
                .filter(prop => parsedProps[prop].required)
                .forEach(prop =>
                    defaultProps[prop] = `${prop}: ${getValueForType(parsedProps[prop].type.name)}`
                );
        } catch (e) {
            console.log('Not able to process ', componentName);
        }
        console.log(defaultProps);
        try{
            fs.writeFileSync(testFilePath, ejs.render(template, {componentName, defaultProps}));
            console.log('CREATED TEST FOR ', pathToFile);
        } catch (e) {
            console.log(e);
        }
    }
};

// TODO: Read path from args.
walkTheDirectory('./', 'index.js', createTest);
