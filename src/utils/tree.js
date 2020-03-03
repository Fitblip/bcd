import dayjs from "dayjs";

export function getTree(data, kind) {
    let res = [];

    if (Object.keys(data).length == 0) {
        res.push({
            name: 'map',
            children: [],
            value: '0 items',
            value_type: 'map',
            type: "object",
            kind: kind,
            id: getId()
        });
        return res;
    }

    if (data.kind !== undefined) {
        kind = parseKind(data.kind);
        delete data.kind;
    }

    if (data.type !== undefined) {
        res.push({
            name: data.type,
            children: [],
            value: getValue(data) || null,
            value_type: data.type,
            type: "value",
            kind: kind,
            id: getId()
        });
        return res;
    }

    if (data.from) {
        res.push(...getTree(data.from, kind))
        return res;
    }

    for (const x in data) {
        let item = {
            name: x,
            children: [],
            value: "null",
            type: "value",
            kind: kind,
            id: getId()
        };
        if (typeof data[x] === "object") {
            if (data[x] != null) {
                if (data[x].kind !== undefined) {
                    item.kind = parseKind(data[x].kind);
                    delete data[x].kind;
                }

                if (data[x].value !== undefined && data[x].type !== undefined) {
                    if (data[x].value != null)
                        item.value = getValue(data[x]);
                    item.value_type = data[x].type;
                } else {
                    item.type = "object";
                    if (Object.keys(data[x]).length == 0) {
                        item.value = `0 items`;
                    } else {
                        item.children = getTree(data[x], item.kind);
                        item.value = `${item.children.length} items`;
                    }
                }
            }
        } else {
            item.value = data[x];
        }
        res.push(item);
    }
    return res;
}


export function getEntrypointTree(data) {
    let res = [];
    if (data.type !== undefined) {
        let item = {
            name: '',
            children: [],
            value: data.type,
            type: "value",
            id: getId()
        }
        if (data.type === 'contract' || data.type === 'lambda') {
            item.value = `${data.type} (${data.params})`
        }
        if (data.type === 'list' || data.type === 'set') {
            item.value = getListType(data);
        }
        res.push(item);
        return res;
    }

    for (const x in data) {
        let item = {
            name: x,
            children: [],
            value: "",
            type: "value",
            id: getId()
        };
        if (typeof data[x] === "object" && data[x] != null) {
            if (data[x].type !== undefined) {
                if (data[x].type === 'contract' || data[x].type === 'lambda') {
                    item.value = `${data[x].type} (${data[x].params})`
                } else if (data[x].type === 'list' || data[x].type === 'set') {
                    item.value = getListType(data[x]);
                } else {
                    item.value = data[x].type
                }
            } else {
                item.type = "object";
                if (Object.keys(data[x]).length == 0) {
                    item.value = `0 items`;
                } else {
                    item.children = getEntrypointTree(data[x]);
                }
            }
        }
        res.push(item);
    }
    return res;
}

function getListType(item) {
    if (item.params === undefined) {
        return item.type;
    }

    let s = '';
    if (item.type !== undefined) {
        s += item.type;
    }

    s += ' (';
    for (let i = 0; i < item.params.length; i++) {
        s += getListType(item.params[i])
        if (i != item.params.length - 1) {
            s += ', '
        }
    }
    s += ')'
    return s;
}

function getId() {
    return Math.floor(Math.random() * (+100000000 - +1)) + +1;
}

function getValue(item) {
    if (item.from !== undefined && item.value !== undefined) {
        let start = parseType(item.from, item.type);
        let end = parseType(item.value, item.type);
        return `${start} -> ${end}`;
    }
    if (item.value !== undefined && item.type !== undefined)
        return parseType(item.value, item.type)
    if (item.type === 'unit') {
        return 'null';
    }
    return item;
}

function parseType(val, typ) {
    if (typ === "mutez") {
        let xtz = (val / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 });
        return `${xtz} \uA729`;
    } else if (typ === "timestamp") {
        if (typeof val === 'string') {
            let d = dayjs(val);
            if (d.isValid())
                return d.format("DD MMMM YYYY HH:mm");
        } else {
            let d = dayjs(val * 1000);
            if (d.isValid())
                return d.format("DD MMMM YYYY HH:mm");
        }
    }
    return val;
}

function parseKind(kind) {
    if (kind === 'create') {
        return 'added-tree-item'
    } else if (kind === 'update') {
        return 'edited-tree-item'
    } else if (kind === 'delete') {
        return 'removed-tree-item'
    }
    return '';
}