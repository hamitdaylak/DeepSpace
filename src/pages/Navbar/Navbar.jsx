import { Outlet, Link } from "react-router-dom";
import './assets/main.css';
import logo from './assets/opensea.svg';
import avatar from './assets/avatar.png'
import walletIcon from './assets/icons8-wallet-48.png'
import eth from './assets/eth.svg'

const Navbar = () => {

  function DisplayAccount() {
    var a = document.getElementById("wallet-checkbox").checked;
  
      if(a) {
        document.getElementById("account-details").style.width = "420px";
      document.getElementById("account-details").style.padding = "20px";
        document.body.style.backgroundColor = "#202225";
      }
      else {
      document.getElementById("account-details").style.width = "0";
      document.getElementById("account-details").style.padding = "0";
      document.body.style.backgroundColor = "#202225";
      }
  } 

    return (
      <>
        <div class="header">
        </div>
        <header id="header" class="header fixed-top sticked" data-scrollto-offset="0">
        <div class="container-fluid d-flex align-items-center justify-content-between">
        <div class="logo d-flex align-items-center scrollto me-auto me-lg-0">
          <Link to="/">
          <img src={logo} alt="Logo" />
          </Link>
          <Link to="/">
          <h1 class="logotext">DeepSpace</h1>
          </Link>
        </div>

        <nav id="navbar" class="navbar">
          <div class="search-bar">
            <input type="text" id="box" placeholder="Search anything..." class="search__box" />
            <i class="fas fa-search search__icon" id="icon"></i>
          </div>

          <ul>
            <li><Link to="/explore"><h1 class="navbar-text">Explore</h1></Link></li>
            <li><Link to="/stats"><h1 class="navbar-text">Stats</h1></Link></li>   
            <li><Link to="/mint"><h1 class="navbar-text">Create</h1></Link></li>
            <li><Link to="/queries"><h1 class="navbar-text">Queries</h1></Link></li>
            <li><Link to="/profile"><img class="avatar-style" src={avatar} alt="" /></Link></li>
            <li><img class='wallet-item' src={walletIcon} alt="" /></li>
            <input class="wallet-checkbox" id="wallet-checkbox" type="checkbox" onChange={DisplayAccount} />
          </ul>
        </nav>
        </div>
        </header>
        <div id="account-details" class="sidenav">
          <div class="container">
            <div class="row canvas-area-top">
              <div class="col main-text">
                My Wallet
              </div>
              <div class="col align-items-end address-text">
                0xdb5D...1108
              </div>
            </div>
          </div>

          <div class="cointainer canvas-area">
            <p class="text1"> Total Balance </p>
            <h2 class="text-main"> $72.64 USD </h2>
    
            <button class="funds-btn">
              Add Funds
            </button>
          </div>

          <div class="container canvas-area2">
            <div class="row">
              <div class="col-1">
                <img src={eth} height="25px" alt="" />
              </div>
              <div class="col-3">
                <h3>ETH</h3>
                <p>Ganache</p>
              </div>
              <div class="col-4">
              </div>
              <div class="col-4">
                <h3>0.1791</h3>
                <p>$72.62 USD</p>
              </div>
            </div>
          </div>

        </div>
        <Outlet />
      </>
    )
  };
  
  export default Navbar;