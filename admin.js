const menuList =
document.getElementById("menuList");

const orderList =
document.getElementById("orderList");

document
.getElementById("addMenuBtn")
.addEventListener("click", addMenu);

function addMenu(){

    const name =
    document.getElementById("menuName").value;

    const price =
    Number(
        document.getElementById("menuPrice").value
    );

    const desc =
    document.getElementById("menuDesc").value;

    const category =
    document.getElementById("menuCategory").value;

    const imageFile =
    document.getElementById("menuImage")
    .files[0];

    if(!imageFile){
        alert("Sila pilih gambar");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e){

        let menus =
        JSON.parse(
            localStorage.getItem("adminMenus")
            || "[]"
        );

        menus.push({
            id: Date.now(),
            name,
            price,
            category,
            desc,
            image: e.target.result,
            soldOut:false
        });

        localStorage.setItem(
            "adminMenus",
            JSON.stringify(menus)
        );

        loadMenus();

        alert("Menu berjaya ditambah");
    };

    reader.readAsDataURL(imageFile);
}


function loadMenus(){

    let menus =
    JSON.parse(
        localStorage.getItem("adminMenus")
        || "[]"
    );

    menuList.innerHTML =
    menus.map((m,index)=>`

    <div class="panel">
<img
src="${m.image}"
style="
width:120px;
height:120px;
object-fit:cover;
border-radius:8px;
">

      <b>${m.name}</b>

<br>
<br>

Kategori: ${m.category}
<br>

RM ${m.price}

<br>

${m.desc}

       <button onclick="toggleSoldOut(${index})">

    ${m.soldOut ?
    'Available' :
    'Sold Out'}

</button>

<button onclick="deleteMenu(${index})">
Delete
</button>

    </div>

    `).join("");
}
function deleteMenu(index){

    let menus =
    JSON.parse(
        localStorage.getItem("adminMenus")
        || "[]"
    );

    if(confirm("Delete menu ini?")){

        menus.splice(index,1);

        localStorage.setItem(
            "adminMenus",
            JSON.stringify(menus)
        );

        loadMenus();
    }
}

function toggleSoldOut(index){

    let menus =
    JSON.parse(
        localStorage.getItem("adminMenus")
        || "[]"
    );

    menus[index].soldOut =
    !menus[index].soldOut;

    localStorage.setItem(
        "adminMenus",
        JSON.stringify(menus)
    );

    loadMenus();
}

function loadOrders(){

    let html = "";

    const users =
    JSON.parse(
        localStorage.getItem("manishub.users")
        || "[]"
    );

    users.forEach(user=>{

        const orders =
        JSON.parse(
        localStorage.getItem(
        "manishub.orders." +
        user.email
        ) || "[]"
        );

        orders.forEach(order=>{

            html += `

            <div class="panel">

                <b>${user.name}</b>

                <br>

                ${user.email}

                <br><br>

                ${order.items.map(
                    i=>`${i.qty}x ${i.name}`
                ).join(", ")}

                <br><br>

                Status:
                ${order.status}

<img
src="${order.paymentProof}"
width="200">

<br><br>

<button onclick="approvePayment('${order.id}')">
Terima Bayaran
</button>

            </div>

            `;
        });

    });

    orderList.innerHTML = html;
}

loadMenus();
loadOrders();