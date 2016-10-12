import React, {Component, PropTypes} from 'react';
import Select from 'react-select';

// TODO - remove
AWS.config.update({
    accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
    secretAccessKey: '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',

    // TODO - I think we'll need to retrieve region
    region: 'us-west-2'

});

const s3 = new AWS.S3();
window.s3 = s3;

const Table = props => {
    const {rows, columns} = props;
    return (
        <table>
            <thead>
                <tr>
                    {columns.map(column => <th>{column}</th>)}
                </tr>
            </thead>

            <tbody>
                {
                    rows.map(row =>
                        <tr>
                            {row.map(cell => <td>{cell}</td>)}
                        </tr>
                    )
                }
            </tbody>
        </table>
    );
}

const BucketList = props => {
    const {buckets, selectPath} = props;
    if (buckets) {
        const {Contents} = buckets;

    } else {
        return <div>nothing found</div>;
    }
}

const Bucket = bucketMeta => {
    const {Key, LastModified} = bucketMeta;
    const isFolder = Key.endsWith('/');
    if (isFolder) {
        return (
            <a href="#"><h6>{Key}</h6></a>
        );
    } else {
        return (
            <h6>{Key}</h6>
        );
    }
}

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: '',
            bucketName: 'plotly-s3-connector-test',
            rows: [[]],
            columns: []
        };

        this.listContents = this.listContents.bind(this);
        this.renderBuckets = this.renderBuckets.bind(this);
    }

    listContents() {
        const {bucketName} = this.state;
        this.setState({status: 'loading'});
        s3.listObjects({Bucket: bucketName}, (err, data) => {
            if (err) {
                this.setState({status: `error - ${err}`});
            } else {
                this.setState({status: ''});
                this.setState({[bucketName]: data});
            }
        });
    }

    parseAndDownloadFile(s3key) {
        this.setState({status: 'loading...', rows: [[]], columns: []});
        s3.getObject({
            Bucket: 'plotly-s3-connector-test',
            Key: '5k-scatter.csv'
        }, (err, response) => {
            // TODO - When we send this to Plotly's server for parsing, we'll
            // probably want to keep things in a utf8array since binary files
            // like xlsx files or parquet files will translate to gibberish
            // Not totally sure what the backend's parsing routine will look like.
            const stringData = new TextDecoder('utf-8').decode(response.Body);
            const allRows = stringData.split('\n').map(row => row.split(','));
            const columns = allRows[0];
            const rows = allRows.slice(1);
            this.setState({rows, columns, status: ''});
        });
    }

    renderBuckets() {
        const {bucketName} = this.state;
        if (this.state[bucketName]) {
            const {Contents} = this.state[bucketName];
            return (
                <div>
                    {Contents.map(bucket => {
                        const {Key, LastModified} = bucket;
                        const splitKey = Key.split('/');

                        return (
                            <div style={{cursor: 'pointer', color: (Key.endsWith('.csv') || Key.endsWith('.xlsx')) ? 'blue' : ''}}
                                 onClick={() => this.parseAndDownloadFile(Key)}
                            >
                                {splitKey[splitKey.length-1]} - ({splitKey.slice(0, splitKey.length-1).join('/')})
                            </div>
                        );
                    })}
                </div>
            );
        } else {
            return <div/>;
        }
    }

    render() {
        const {
            bucketList,
            bucketName,
            status,
            rows,
            columns
        } = this.state;

        return (
            <div>

                <h1>s3</h1>

                <div>

                    <input
                        type="text"
                        value={bucketName}
                        onChange={e =>
                            this.setState({bucketName: e.target.value})
                        }
                        placeholder="s3 bucket"
                    />
                    <button onClick={this.listContents}>load</button>
                    {status}
                </div>

                <div>
                    {this.renderBuckets()}
                </div>

                <Table rows={rows} columns={columns}/>

            </div>
        );

    }

}
